import type { CodeReview, ReviewRequest } from "../../domain/types";
import { CodeReviewSchema } from "../../domain/schemas";
import type { ReviewProvider } from "./ReviewProvider";
import { SYSTEM_REVIEW_PROMPT, createReviewUserPrompt } from "../ai/prompts";
import { extractAndValidateJson } from "../ai/jsonExtractor";

export interface LLMConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string; // Optional custom endpoint, defaults to OpenAI or Gemini
  providerType?: "gemini" | "openai";
}

/**
 * Sanitizes sensitive credentials such as API keys from error messages before exposure to the UI.
 */
export function sanitizeError(message: string, apiKey?: string): string {
  if (!apiKey || apiKey.trim().length === 0) {
    return message;
  }
  return message.split(apiKey.trim()).join("[REDACTED_API_KEY]");
}

/**
 * ReviewProvider implementation that communicates directly with LLM endpoints (Gemini, OpenAI)
 * via browser fetch, validates responses with Zod, and handles errors gracefully.
 */
export class LLMReviewProvider implements ReviewProvider {
  readonly name: string = "LLM Review Provider";
  private readonly config: LLMConfig;

  constructor(config: LLMConfig = {}) {
    this.config = config;
  }

  async review(request: ReviewRequest): Promise<CodeReview> {
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) {
      throw new Error(
        "API key is missing. Please provide a valid API key in settings or switch to Mock Mode for instant testing."
      );
    }

    if (!request.code || !request.code.trim()) {
      throw new Error("Code snippet cannot be empty.");
    }

    const providerType =
      this.config.providerType ??
      (this.config.endpoint?.includes("openai") ? "openai" : "gemini");

    const userPrompt = createReviewUserPrompt(request.code, request.language);

    const rawContent =
      providerType === "openai"
        ? await this.callOpenAI(apiKey, userPrompt)
        : await this.callGemini(apiKey, userPrompt);

    return extractAndValidateJson(rawContent, CodeReviewSchema);
  }

  private async callGemini(apiKey: string, userPrompt: string): Promise<string> {
    const model = this.config.model ?? "gemini-1.5-flash";
    const endpoint =
      this.config.endpoint ??
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_REVIEW_PROMPT}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError) {
      const msg = networkError instanceof Error ? networkError.message : String(networkError);
      throw new Error(
        sanitizeError(`Network error communicating with Gemini API: ${msg}`, apiKey)
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      if (response.status === 401) {
        throw new Error(
          "Gemini API authentication failed (401 Unauthorized): Invalid API key or credentials. Please check your API key or switch to Mock Mode."
        );
      }
      if (response.status === 429) {
        throw new Error(
          "Gemini API rate limit exceeded (429 Rate limit): Too many requests. Please wait a moment or switch to Mock Mode."
        );
      }
      const rawError = `Gemini API request failed with status ${response.status} (${response.statusText})${
        errorText ? `: ${errorText}` : ""
      }`;
      throw new Error(sanitizeError(rawError, apiKey));
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content || typeof content !== "string") {
      throw new Error(
        "No response content returned from Gemini API. The response candidate was empty or missing."
      );
    }

    return content;
  }

  private async callOpenAI(apiKey: string, userPrompt: string): Promise<string> {
    const model = this.config.model ?? "gpt-4o-mini";
    const endpoint =
      this.config.endpoint ?? "https://api.openai.com/v1/chat/completions";

    const payload = {
      model,
      messages: [
        { role: "system", content: SYSTEM_REVIEW_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError) {
      const msg = networkError instanceof Error ? networkError.message : String(networkError);
      throw new Error(
        sanitizeError(`Network error communicating with OpenAI API: ${msg}`, apiKey)
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      if (response.status === 401) {
        throw new Error(
          "OpenAI API authentication failed (401 Unauthorized): Invalid API key or credentials. Please check your API key or switch to Mock Mode."
        );
      }
      if (response.status === 429) {
        throw new Error(
          "OpenAI API rate limit exceeded (429 Rate limit): Too many requests. Please wait a moment or switch to Mock Mode."
        );
      }
      const rawError = `OpenAI API request failed with status ${response.status} (${response.statusText})${
        errorText ? `: ${errorText}` : ""
      }`;
      throw new Error(sanitizeError(rawError, apiKey));
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error(
        "No response content returned from OpenAI API. The response message was empty or missing."
      );
    }

    return content;
  }
}
