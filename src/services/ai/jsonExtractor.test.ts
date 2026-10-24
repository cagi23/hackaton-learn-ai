import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  extractAndValidateJson,
  JsonExtractionError,
  JsonValidationError,
} from "./jsonExtractor";
import { CodeReviewSchema } from "../../domain/schemas";

describe("extractAndValidateJson", () => {
  const TestSchema = z.object({
    message: z.string(),
    count: z.number(),
  });

  it("extracts and validates valid JSON from a pure JSON string", () => {
    const raw = JSON.stringify({ message: "hello", count: 42 });
    const result = extractAndValidateJson(raw, TestSchema);
    expect(result).toEqual({ message: "hello", count: 42 });
  });

  it("extracts and validates JSON enclosed in ```json code fences", () => {
    const raw = "```json\n" + JSON.stringify({ message: "fenced", count: 10 }) + "\n```";
    const result = extractAndValidateJson(raw, TestSchema);
    expect(result).toEqual({ message: "fenced", count: 10 });
  });

  it("extracts and validates JSON enclosed in plain ``` code fences", () => {
    const raw = "```\n" + JSON.stringify({ message: "plain", count: 5 }) + "\n```";
    const result = extractAndValidateJson(raw, TestSchema);
    expect(result).toEqual({ message: "plain", count: 5 });
  });

  it("extracts JSON with leading and trailing conversational commentary", () => {
    const raw = `Here is your requested review in JSON format:
\`\`\`json
{
  "message": "commentary test",
  "count": 7
}
\`\`\`
I hope this helps! Let me know if you need any adjustments.`;
    const result = extractAndValidateJson(raw, TestSchema);
    expect(result).toEqual({ message: "commentary test", count: 7 });
  });

  it("extracts JSON with arbitrary text outside braces without code fences", () => {
    const raw = `Sure thing! {"message":"no fences","count":99} Have a great day!`;
    const result = extractAndValidateJson(raw, TestSchema);
    expect(result).toEqual({ message: "no fences", count: 99 });
  });

  it("throws JsonExtractionError when text contains no JSON object", () => {
    const raw = "This is just a sentence without any json object in it.";
    expect(() => extractAndValidateJson(raw, TestSchema)).toThrow(
      JsonExtractionError
    );
    expect(() => extractAndValidateJson(raw, TestSchema)).toThrow(
      /No JSON object found/i
    );
  });

  it("throws JsonExtractionError when input is empty or invalid string", () => {
    expect(() => extractAndValidateJson("", TestSchema)).toThrow(
      JsonExtractionError
    );
  });

  it("throws JsonExtractionError when JSON syntax is corrupted", () => {
    const raw = "```json\n{ message: 'invalid json without quotes', count: }\n```";
    expect(() => extractAndValidateJson(raw, TestSchema)).toThrow(
      JsonExtractionError
    );
    expect(() => extractAndValidateJson(raw, TestSchema)).toThrow(
      /Failed to parse JSON/i
    );
  });

  it("throws JsonValidationError when JSON does not conform to the schema", () => {
    const raw = JSON.stringify({ message: "missing count" });
    expect(() => extractAndValidateJson(raw, TestSchema)).toThrow(
      JsonValidationError
    );
    expect(() => extractAndValidateJson(raw, TestSchema)).toThrow(
      /validation failed/i
    );
  });

  it("validates full CodeReview objects against CodeReviewSchema", () => {
    const validCodeReview = {
      summary: {
        overallQuality: "Needs Improvement",
        findingsCount: 1,
      },
      findings: [
        {
          id: "finding-1",
          title: "Unsafe Undefined Access",
          category: "type-safety",
          severity: "high",
          description: "Potential runtime error when item is undefined",
          whyItMatters: "Causes unhandled TypeError in production",
          principle: "Null Safety",
          suggestion: "Use optional chaining",
          challenge: {
            question: "How to safely read property?",
            answers: [
              { id: "a", text: "Use ?." },
              { id: "b", text: "Use !" },
            ],
            correctAnswerId: "a",
            explanation: "Optional chaining is safe.",
          },
        },
      ],
    };

    const raw = `Here is the review:\n\`\`\`json\n${JSON.stringify(validCodeReview, null, 2)}\n\`\`\``;
    const result = extractAndValidateJson(raw, CodeReviewSchema);
    expect(result.summary.overallQuality).toBe("Needs Improvement");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].whyItMatters).toBe(
      "Causes unhandled TypeError in production"
    );
  });

  it("throws JsonValidationError when CodeReview finding is missing whyItMatters", () => {
    const invalidCodeReview = {
      summary: {
        overallQuality: "Needs Improvement",
        findingsCount: 1,
      },
      findings: [
        {
          id: "finding-1",
          title: "Unsafe Undefined Access",
          category: "type-safety",
          severity: "high",
          description: "Missing whyItMatters field",
          // whyItMatters missing
          principle: "Null Safety",
          suggestion: "Use optional chaining",
          challenge: {
            question: "How to safely read property?",
            answers: [
              { id: "a", text: "Use ?." },
              { id: "b", text: "Use !" },
            ],
            correctAnswerId: "a",
            explanation: "Optional chaining is safe.",
          },
        },
      ],
    };

    const raw = JSON.stringify(invalidCodeReview);
    expect(() => extractAndValidateJson(raw, CodeReviewSchema)).toThrow(
      JsonValidationError
    );
    expect(() => extractAndValidateJson(raw, CodeReviewSchema)).toThrow(
      /whyItMatters/i
    );
  });

  it("handles JSON where property values contain markdown backticks or fences", () => {
    const jsonWithFences = {
      message: "code example: ```ts\nconst x = 1;\n```",
      count: 1,
    };
    const raw = `\`\`\`json\n${JSON.stringify(jsonWithFences, null, 2)}\n\`\`\``;
    const result = extractAndValidateJson(raw, TestSchema);
    expect(result.message).toContain("const x = 1;");
  });
});
