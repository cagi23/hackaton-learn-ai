import { describe, it, expect } from "vitest";
import {
  CodeReviewSchema,
  ReviewFindingSchema,
  ReviewChallengeSchema,
  ReviewRequestSchema,
  SkillScoresSchema,
  FindingCategorySchema,
  FindingSeveritySchema,
} from "./schemas";
import type { CodeReview, ReviewFinding, ReviewChallenge } from "./types";

describe("Domain Schemas & Validation", () => {
  const validChallenge: ReviewChallenge = {
    question: "What is the primary risk of using `any` in this function signature?",
    code: "function parse(data: any): string",
    answers: [
      { id: "a", text: "Loss of compile-time type safety" },
      { id: "b", text: "Immediate syntax error at runtime" },
      { id: "c", text: "Increased bundle size" },
    ],
    correctAnswerId: "a",
    explanation:
      "Using `any` disables TypeScript type checking, allowing unexpected data shapes to trigger runtime exceptions.",
  };

  const validFinding: ReviewFinding = {
    id: "finding-1",
    title: "Unsafe any parameter type",
    category: "type-safety",
    severity: "high",
    affectedCode: "function parse(data: any) { return data.user.id; }",
    description: "The parameter is typed as any, which completely disables static analysis for this function.",
    whyItMatters:
      "Unchecked property accesses on any can cause unhandled TypeError crashes in production when malformed data is received.",
    principle: "Strict Type Safety",
    suggestion: "Use unknown with runtime validation or define a strict interface for the expected input payload.",
    improvedCode: "function parse(data: unknown) { if (isUserData(data)) return data.user.id; }",
    challenge: validChallenge,
  };

  const validReview: CodeReview = {
    summary: {
      overallQuality: "Needs improvement",
      findingsCount: 1,
    },
    findings: [validFinding],
  };

  describe("CodeReviewSchema", () => {
    it("successfully parses a valid CodeReview object", () => {
      const result = CodeReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary.findingsCount).toBe(1);
        expect(result.data.findings[0].title).toBe("Unsafe any parameter type");
      }
    });

    it("fails parsing when mandatory educational field whyItMatters is missing", () => {
      const invalidFinding = { ...validFinding };
      delete (invalidFinding as Record<string, unknown>).whyItMatters;

      const invalidReview = {
        ...validReview,
        findings: [invalidFinding],
      };

      const result = CodeReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join("."));
        expect(paths).toContain("findings.0.whyItMatters");
      }
    });

    it("fails parsing when mandatory educational field principle is missing", () => {
      const invalidFinding = { ...validFinding };
      delete (invalidFinding as Record<string, unknown>).principle;

      const invalidReview = {
        ...validReview,
        findings: [invalidFinding],
      };

      const result = CodeReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join("."));
        expect(paths).toContain("findings.0.principle");
      }
    });

    it("fails parsing when whyItMatters or principle is an empty string", () => {
      const invalidFindingEmptyWhy = { ...validFinding, whyItMatters: "" };
      expect(ReviewFindingSchema.safeParse(invalidFindingEmptyWhy).success).toBe(false);

      const invalidFindingEmptyPrinciple = { ...validFinding, principle: "" };
      expect(ReviewFindingSchema.safeParse(invalidFindingEmptyPrinciple).success).toBe(false);
    });

    it("fails parsing when finding IDs are not unique", () => {
      const duplicateFindingsReview = {
        ...validReview,
        findings: [
          validFinding,
          { ...validFinding, title: "Second issue with same ID" },
        ],
      };
      const result = CodeReviewSchema.safeParse(duplicateFindingsReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("findings");
      }
    });
  });

  describe("ReviewFindingSchema", () => {
    it("fails parsing when category is invalid", () => {
      const invalidFinding = { ...validFinding, category: "not-a-real-category" };
      const result = ReviewFindingSchema.safeParse(invalidFinding);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join("."));
        expect(paths).toContain("category");
      }
    });

    it("fails parsing when severity is invalid", () => {
      const invalidFinding = { ...validFinding, severity: "super-critical" };
      const result = ReviewFindingSchema.safeParse(invalidFinding);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join("."));
        expect(paths).toContain("severity");
      }
    });

    it("accepts finding without optional affectedCode and improvedCode", () => {
      const minimalFinding: ReviewFinding = {
        ...validFinding,
        affectedCode: undefined,
        improvedCode: undefined,
      };
      const result = ReviewFindingSchema.safeParse(minimalFinding);
      expect(result.success).toBe(true);
    });

    it("validates all allowed category enum values", () => {
      const validCategories = [
        "bug",
        "security",
        "maintainability",
        "type-safety",
        "testing",
        "performance",
        "readability",
      ] as const;

      validCategories.forEach((cat) => {
        expect(FindingCategorySchema.safeParse(cat).success).toBe(true);
      });
    });

    it("validates all allowed severity enum values", () => {
      const validSeverities = ["critical", "high", "medium", "low"] as const;

      validSeverities.forEach((sev) => {
        expect(FindingSeveritySchema.safeParse(sev).success).toBe(true);
      });
    });
  });

  describe("ReviewChallengeSchema", () => {
    it("successfully parses a valid ReviewChallenge", () => {
      const result = ReviewChallengeSchema.safeParse(validChallenge);
      expect(result.success).toBe(true);
    });

    it("fails if correctAnswerId does not match any answer in answers[]", () => {
      const mismatchedChallenge: ReviewChallenge = {
        ...validChallenge,
        correctAnswerId: "non-existent-id",
      };

      const result = ReviewChallengeSchema.safeParse(mismatchedChallenge);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join("."));
        expect(paths).toContain("correctAnswerId");
      }
    });

    it("fails if answers array has fewer than 2 items", () => {
      const tooFewAnswers = {
        ...validChallenge,
        answers: [{ id: "a", text: "Only one choice" }],
        correctAnswerId: "a",
      };

      const result = ReviewChallengeSchema.safeParse(tooFewAnswers);
      expect(result.success).toBe(false);
    });

    it("fails if answers array has more than 4 items", () => {
      const tooManyAnswers = {
        ...validChallenge,
        answers: [
          { id: "a", text: "A" },
          { id: "b", text: "B" },
          { id: "c", text: "C" },
          { id: "d", text: "D" },
          { id: "e", text: "E" },
        ],
        correctAnswerId: "a",
      };

      const result = ReviewChallengeSchema.safeParse(tooManyAnswers);
      expect(result.success).toBe(false);
    });

    it("fails if answer IDs are not unique within answers[]", () => {
      const duplicateAnswerIds = {
        ...validChallenge,
        answers: [
          { id: "opt-1", text: "Option A" },
          { id: "opt-1", text: "Option B" },
          { id: "opt-2", text: "Option C" },
        ],
        correctAnswerId: "opt-1",
      };

      const result = ReviewChallengeSchema.safeParse(duplicateAnswerIds);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("answers");
      }
    });

    it("accepts challenge when optional code is omitted", () => {
      const noCodeChallenge: ReviewChallenge = {
        ...validChallenge,
        code: undefined,
      };

      const result = ReviewChallengeSchema.safeParse(noCodeChallenge);
      expect(result.success).toBe(true);
    });
  });

  describe("ReviewRequestSchema", () => {
    it("successfully parses a valid request", () => {
      const result = ReviewRequestSchema.safeParse({
        code: "const x = 1;",
        language: "typescript",
      });
      expect(result.success).toBe(true);
    });

    it("fails parsing when code is empty or missing", () => {
      expect(ReviewRequestSchema.safeParse({ code: "" }).success).toBe(false);
      expect(ReviewRequestSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("SkillScoresSchema", () => {
    it("successfully parses valid scores", () => {
      const scores = {
        "bug-detection": 75,
        security: 50,
        maintainability: 80,
        "type-safety": 60,
        testing: 90,
      };

      const result = SkillScoresSchema.safeParse(scores);
      expect(result.success).toBe(true);
    });

    it("fails parsing when score is outside 0-100 range", () => {
      const invalidScores = {
        "bug-detection": 105,
      };

      const result = SkillScoresSchema.safeParse(invalidScores);
      expect(result.success).toBe(false);
    });
  });
});
