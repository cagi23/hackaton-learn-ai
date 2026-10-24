import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LLMReviewProvider, sanitizeError } from "./LLMReviewProvider";
import type { CodeReview } from "../../domain/types";

const MOCK_VALID_CODE_REVIEW: CodeReview = {
  summary: {
    overallQuality: "Needs Improvement",
    findingsCount: 1,
  },
  findings: [
    {
      id: "finding-1",
      title: "Potential Null Pointer Dereference",
      category: "bug",
      severity: "high",
      affectedCode: "const val = user.profile.name;",
      description: "User profile might be undefined.",
      whyItMatters: "May crash during user profile rendering.",
      principle: "Defensive Programming",
      suggestion: "Use optional chaining user?.profile?.name.",
      improvedCode: "const val = user?.profile?.name ?? 'Anonymous';",
      challenge: {
        question: "How should you safely navigate nested nullable properties?",
        answers: [
          { id: "opt-1", text: "Using optional chaining (?.)" },
          { id: "opt-2", text: "Using non-null assertion (!)" },
          { id: "opt-3", text: "Ignoring null checks" },
        ],
        correctAnswerId: "opt-1",
        explanation: "Optional chaining safely returns undefined if nullish.",
      },
    },
  ],
};

describe("LLMReviewProvider", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("API key validation", () => {
    it("throws informative error when API key is missing in config", async () => {
      const provider = new LLMReviewProvider({ apiKey: "" });
      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/API key is missing.*Mock Mode/i);
    });

    it("throws informative error when config has undefined apiKey", async () => {
      const provider = new LLMReviewProvider({});
      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/API key is missing.*Mock Mode/i);
    });

    it("throws error when code snippet is empty or whitespace", async () => {
      const provider = new LLMReviewProvider({ apiKey: "some-key" });
      await expect(
        provider.review({ code: "   " })
      ).rejects.toThrow(/Code snippet cannot be empty/i);
    });
  });

  describe("Gemini provider integration", () => {
    it("successfully reviews code and parses Gemini response", async () => {
      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify(MOCK_VALID_CODE_REVIEW),
                },
              ],
            },
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => geminiResponse,
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "fake-gemini-key",
        providerType: "gemini",
      });

      const result = await provider.review({
        code: "function test() {}",
        language: "typescript",
      });

      expect(result.summary.findingsCount).toBe(1);
      expect(result.findings[0].id).toBe("finding-1");
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = (globalThis.fetch as any).mock.calls[0];
      expect(calledUrl).toContain("generativelanguage.googleapis.com");
      expect(calledUrl).toContain("fake-gemini-key");
      expect(calledOptions.method).toBe("POST");
    });
  });

  describe("OpenAI provider integration", () => {
    it("successfully reviews code and parses OpenAI response", async () => {
      const openAiResponse = {
        choices: [
          {
            message: {
              content: `\`\`\`json\n${JSON.stringify(MOCK_VALID_CODE_REVIEW)}\n\`\`\``,
            },
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => openAiResponse,
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "sk-fake-openai-key",
        providerType: "openai",
        model: "gpt-4o",
      });

      const result = await provider.review({
        code: "function test() {}",
        language: "typescript",
      });

      expect(result.summary.findingsCount).toBe(1);
      expect(result.findings[0].title).toBe("Potential Null Pointer Dereference");
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = (globalThis.fetch as any).mock.calls[0];
      expect(calledUrl).toBe("https://api.openai.com/v1/chat/completions");
      expect(calledOptions.headers.Authorization).toBe("Bearer sk-fake-openai-key");
    });
  });

  describe("HTTP Error handling", () => {
    it("handles 401 Unauthorized with clear guidance for Mock Mode", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid API key provided",
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "invalid-key",
        providerType: "gemini",
      });

      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/401.*Mock Mode/i);
    });

    it("handles 429 Rate Limit with clear guidance", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "Quota exceeded",
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "rate-limited-key",
        providerType: "openai",
      });

      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/429.*Rate limit.*Mock Mode/i);
    });

    it("handles 500 Server Error cleanly", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server crashed",
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "some-key",
      });

      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/500/i);
    });

    it("handles network failures gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const provider = new LLMReviewProvider({
        apiKey: "some-key",
      });

      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/Network error/i);
    });

    it("redacts sensitive API key from network and API error messages", async () => {
      const secretKey = "super-secret-api-key-12345";
      globalThis.fetch = vi.fn().mockRejectedValue(new Error(`Connection failed to endpoint?key=${secretKey}`));

      const provider = new LLMReviewProvider({
        apiKey: secretKey,
      });

      try {
        await provider.review({ code: "const x = 1;" });
        expect.unreachable("Should have thrown");
      } catch (err: unknown) {
        expect(err instanceof Error).toBe(true);
        if (err instanceof Error) {
          expect(err.message).not.toContain(secretKey);
          expect(err.message).toContain("[REDACTED_API_KEY]");
        }
      }
    });

    it("verifies sanitizeError helper directly", () => {
      expect(sanitizeError("Key abc-123 failed", "abc-123")).toBe("Key [REDACTED_API_KEY] failed");
      expect(sanitizeError("No secret here", undefined)).toBe("No secret here");
      expect(sanitizeError("No secret here", "")).toBe("No secret here");
    });
  });

  describe("Malformed response handling", () => {
    it("handles invalid JSON syntax without crashing", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "This is not json at all." }],
              },
            },
          ],
        }),
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "valid-key",
      });

      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/No JSON object found|Failed to parse/i);
    });

    it("handles schema validation errors without crashing", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: { overallQuality: "Bad", findingsCount: 1 },
                      findings: [
                        {
                          id: "finding-1",
                          title: "Bug",
                          category: "unknown-category", // invalid category
                          severity: "high",
                          description: "Desc",
                          whyItMatters: "Why",
                          principle: "Principle",
                          suggestion: "Fix",
                          challenge: {
                            question: "Q?",
                            answers: [{ id: "1", text: "A" }],
                            correctAnswerId: "1",
                            explanation: "Exp",
                          },
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "valid-key",
      });

      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/schema validation failed/i);
    });

    it("handles empty or missing candidate response structure", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [],
        }),
      } as Response);

      const provider = new LLMReviewProvider({
        apiKey: "valid-key",
      });

      await expect(
        provider.review({ code: "const x = 1;" })
      ).rejects.toThrow(/No response content/i);
    });
  });
});
