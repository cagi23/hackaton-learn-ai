import { z } from "zod";

export class JsonExtractionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "JsonExtractionError";
  }
}

export class JsonValidationError extends Error {
  constructor(
    message: string,
    public readonly issues?: z.ZodIssue[],
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "JsonValidationError";
  }
}

/**
 * Resiliently extracts a JSON string from LLM responses, stripping code fences
 * and locating outermost object braces.
 */
export function extractJsonString(rawText: string): string {
  if (!rawText || typeof rawText !== "string") {
    throw new JsonExtractionError("Input text is empty or not a string");
  }

  let text = rawText.trim();

  // Strip markdown code fences if present (outermost ```json ... ``` or ``` ... ```)
  const firstFence = text.indexOf("```");
  const lastFence = text.lastIndexOf("```");
  if (firstFence !== -1 && lastFence > firstFence) {
    const afterFirst = text.slice(firstFence + 3);
    const newline = afterFirst.indexOf("\n");
    const langTag = newline !== -1 ? afterFirst.slice(0, newline).trim() : "";
    if (langTag === "" || /^json$/i.test(langTag)) {
      const insideFence = text
        .slice(firstFence, lastFence)
        .replace(/^```(?:json)?\s*/i, "")
        .trim();
      if (insideFence.includes("{") && insideFence.includes("}")) {
        text = insideFence;
      }
    }
  }

  // Find outermost JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new JsonExtractionError(
      "No JSON object found in response: missing opening or closing brace"
    );
  }

  return text.slice(firstBrace, lastBrace + 1);
}

/**
 * Extracts JSON from raw LLM text output and validates it against the given Zod schema.
 * Throws JsonExtractionError on parse failure or JsonValidationError on schema mismatch.
 */
export function extractAndValidateJson<T>(
  rawText: string,
  schema: z.ZodType<T>
): T {
  const jsonString = extractJsonString(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new JsonExtractionError(
      `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }

  try {
    return schema.parse(parsed);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new JsonValidationError(
        `JSON schema validation failed: ${details}`,
        err.issues,
        err
      );
    }
    throw err;
  }
}
