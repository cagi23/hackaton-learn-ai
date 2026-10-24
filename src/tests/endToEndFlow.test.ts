import { describe, it, expect, beforeEach } from "vitest";
import { ZodError } from "zod";
import {
  CodeReviewSchema,
  ReviewFindingSchema,
  ReviewChallengeSchema,
} from "../domain/schemas";
import type {
  CodeReview,
  ReviewFinding,
  ReviewChallenge,
  FindingCategory,
} from "../domain/types";
import { ReviewService, reviewService } from "../services/ReviewService";
import { MockReviewProvider } from "../services/providers/MockReviewProvider";
import type { ReviewProvider } from "../services/providers/ReviewProvider";
import {
  SkillService,
  DEFAULT_SKILL_SCORES,
  SKILL_STORAGE_KEY,
  mapCategoryToSkillCategory,
} from "../services/SkillService";
import { ChallengeService, challengeService } from "../services/ChallengeService";
import { DEMO_TYPESCRIPT_CODE, DEMO_FILENAME } from "../data/demoCode";
import { extractAndValidateJson } from "../services/ai/jsonExtractor";

describe("ReviewLens End-to-End Automated Verification Suite", () => {
  let isolatedSkillService: SkillService;
  let isolatedReviewService: ReviewService;
  let mockReviewProvider: MockReviewProvider;

  const validSampleChallenge: ReviewChallenge = {
    question: "What is the primary risk of accessing .quantity directly on find() result?",
    code: "const targetItem = request.items.find((item) => item.productId === 'PROD-VIP');",
    answers: [
      { id: "opt-1", text: "Runtime TypeError: Cannot read properties of undefined" },
      { id: "opt-2", text: "Memory leak in V8 garbage collector" },
      { id: "opt-3", text: "Silent compilation failure in strict mode" },
    ],
    correctAnswerId: "opt-1",
    explanation: "Array.prototype.find() returns undefined if no element satisfies the predicate.",
  };

  const validSampleFinding: ReviewFinding = {
    id: "finding-e2e-1",
    title: "Unchecked find() result property access",
    category: "type-safety",
    severity: "high",
    affectedCode: "const priorityQuantity = targetItem.quantity;",
    description: "Accessing quantity directly on targetItem which may be undefined at runtime.",
    whyItMatters: "Throws an unhandled TypeError that halts checkout processing for non-VIP customers.",
    principle: "Null Safety & Defensive Checks",
    suggestion: "Use optional chaining with nullish coalescing: targetItem?.quantity ?? 0",
    improvedCode: "const priorityQuantity = targetItem?.quantity ?? 0;",
    challenge: validSampleChallenge,
  };

  const validSampleReview: CodeReview = {
    summary: {
      overallQuality: "Needs Improvement",
      findingsCount: 1,
    },
    findings: [validSampleFinding],
  };

  beforeEach(() => {
    localStorage.clear();
    isolatedSkillService = new SkillService();
    mockReviewProvider = new MockReviewProvider();
    isolatedReviewService = new ReviewService(mockReviewProvider);
  });

  // =========================================================================
  // Group 1: Schema Boundary Verification
  // Requirement 1 from spec: Valid AI response accepted; malformed response rejected.
  // =========================================================================
  describe("Group 1: Schema Boundary Verification", () => {
    it("accepts a fully conformant CodeReview object through CodeReviewSchema", () => {
      const parsed = CodeReviewSchema.parse(validSampleReview);
      expect(parsed).toEqual(validSampleReview);
      expect(parsed.summary.findingsCount).toBe(1);
      expect(parsed.findings[0].category).toBe("type-safety");
    });

    it("rejects review and throws ZodError when mandatory educational field whyItMatters is missing", () => {
      const malformedFinding = { ...validSampleFinding };
      delete (malformedFinding as Record<string, unknown>).whyItMatters;

      const malformedReview = {
        ...validSampleReview,
        findings: [malformedFinding],
      };

      expect(() => CodeReviewSchema.parse(malformedReview)).toThrow(ZodError);

      const parseResult = CodeReviewSchema.safeParse(malformedReview);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const paths = parseResult.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("findings.0.whyItMatters");
      }
    });

    it("rejects review and throws ZodError when mandatory educational field principle is missing", () => {
      const malformedFinding = { ...validSampleFinding };
      delete (malformedFinding as Record<string, unknown>).principle;

      const malformedReview = {
        ...validSampleReview,
        findings: [malformedFinding],
      };

      expect(() => CodeReviewSchema.parse(malformedReview)).toThrow(ZodError);

      const parseResult = CodeReviewSchema.safeParse(malformedReview);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const paths = parseResult.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("findings.0.principle");
      }
    });

    it("rejects review and throws ZodError when whyItMatters or principle is an empty string", () => {
      const emptyWhyItMattersFinding = {
        ...validSampleFinding,
        whyItMatters: "",
      };
      expect(() => ReviewFindingSchema.parse(emptyWhyItMattersFinding)).toThrow(ZodError);

      const emptyPrincipleFinding = {
        ...validSampleFinding,
        principle: "   ".trim(),
      };
      expect(() => ReviewFindingSchema.parse(emptyPrincipleFinding)).toThrow(ZodError);
    });

    it("rejects challenge and throws ZodError when correctAnswerId does not match any answer option", () => {
      const malformedChallenge = {
        ...validSampleChallenge,
        correctAnswerId: "non-existent-option-id",
      };

      expect(() => ReviewChallengeSchema.parse(malformedChallenge)).toThrow(ZodError);

      const parseResult = ReviewChallengeSchema.safeParse(malformedChallenge);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const paths = parseResult.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("correctAnswerId");
      }
    });

    it("rejects review when finding has an invalid category or invalid severity", () => {
      const invalidCategoryFinding = {
        ...validSampleFinding,
        category: "invalid-category",
      };
      expect(() => ReviewFindingSchema.parse(invalidCategoryFinding)).toThrow(ZodError);

      const invalidSeverityFinding = {
        ...validSampleFinding,
        severity: "catastrophic",
      };
      expect(() => ReviewFindingSchema.parse(invalidSeverityFinding)).toThrow(ZodError);
    });
  });

  // =========================================================================
  // Group 2: Challenge Engine Verification
  // Requirement 2 from spec: Correct answer detected; incorrect answer detected.
  // =========================================================================
  describe("Group 2: Challenge Engine Verification", () => {
    it("instantiates ChallengeService and provides default singleton", () => {
      const customChallengeService = new ChallengeService();
      expect(customChallengeService).toBeInstanceOf(ChallengeService);
      expect(challengeService).toBeInstanceOf(ChallengeService);
    });
    it("detects correct answer deterministically and returns isCorrect: true with explanation", () => {
      const result = challengeService.evaluateAnswer(
        validSampleChallenge,
        "opt-1",
        "type-safety"
      );

      expect(result.isCorrect).toBe(true);
      expect(result.selectedAnswerId).toBe("opt-1");
      expect(result.correctAnswerId).toBe("opt-1");
      expect(result.explanation).toBe(validSampleChallenge.explanation);
      expect(result.skillCategory).toBe("type-safety");
    });

    it("detects incorrect answer deterministically and returns isCorrect: false with explanation", () => {
      const result = challengeService.evaluateAnswer(
        validSampleChallenge,
        "opt-2",
        "type-safety"
      );

      expect(result.isCorrect).toBe(false);
      expect(result.selectedAnswerId).toBe("opt-2");
      expect(result.correctAnswerId).toBe("opt-1");
      expect(result.explanation).toBe(validSampleChallenge.explanation);
      expect(result.skillCategory).toBe("type-safety");
    });

    it("detects completely unknown answer IDs as incorrect without throwing", () => {
      const result = challengeService.evaluateAnswer(
        validSampleChallenge,
        "arbitrary-unknown-id",
        "bug"
      );

      expect(result.isCorrect).toBe(false);
      expect(result.selectedAnswerId).toBe("arbitrary-unknown-id");
      expect(result.correctAnswerId).toBe("opt-1");
      expect(result.skillCategory).toBe("bug-detection");
      expect(result.explanation).toBe(validSampleChallenge.explanation);
    });

    it("correctly maps all finding categories to their canonical skill categories during evaluation", () => {
      const testCases: Array<{ findingCat: FindingCategory; expectedSkill: string }> = [
        { findingCat: "bug", expectedSkill: "bug-detection" },
        { findingCat: "security", expectedSkill: "security" },
        { findingCat: "maintainability", expectedSkill: "maintainability" },
        { findingCat: "readability", expectedSkill: "maintainability" },
        { findingCat: "performance", expectedSkill: "maintainability" },
        { findingCat: "type-safety", expectedSkill: "type-safety" },
        { findingCat: "testing", expectedSkill: "testing" },
      ];

      for (const { findingCat, expectedSkill } of testCases) {
        const evalResult = challengeService.evaluateAnswer(
          validSampleChallenge,
          validSampleChallenge.correctAnswerId,
          findingCat
        );
        expect(evalResult.skillCategory).toBe(expectedSkill);
      }
    });
  });

  // =========================================================================
  // Group 3: Skill Model & Scoring Verification
  // Requirement 3 from spec: Correct challenge increments appropriate skill; score cannot exceed 100.
  // =========================================================================
  describe("Group 3: Skill Model & Scoring Verification", () => {
    it("uses canonical storage key and hydrates default scores", () => {
      expect(SKILL_STORAGE_KEY).toBe("reviewlens_skills");
      expect(isolatedSkillService.getScores()).toEqual(DEFAULT_SKILL_SCORES);
    });
    it("increments score by default delta (+3) for the targeted skill category", () => {
      const initialScores = isolatedSkillService.getScores();
      const initialBugScore = initialScores["bug-detection"];

      const result = isolatedSkillService.updateScore("bug", 3);

      expect(result.oldScore).toBe(initialBugScore);
      expect(result.newScore).toBe(initialBugScore + 3);
      expect(result.skillCategory).toBe("bug-detection");

      const updatedScores = isolatedSkillService.getScores();
      expect(updatedScores["bug-detection"]).toBe(initialBugScore + 3);
      // Other skills must remain unchanged
      expect(updatedScores.security).toBe(initialScores.security);
      expect(updatedScores.maintainability).toBe(initialScores.maintainability);
      expect(updatedScores["type-safety"]).toBe(initialScores["type-safety"]);
      expect(updatedScores.testing).toBe(initialScores.testing);
    });

    it("strictly enforces score cap at 100 even with multiple increments", () => {
      // Starting maintainability is 84
      isolatedSkillService.updateScore("maintainability", 10); // 94
      expect(isolatedSkillService.getScores().maintainability).toBe(94);

      isolatedSkillService.updateScore("maintainability", 5); // 99
      expect(isolatedSkillService.getScores().maintainability).toBe(99);

      isolatedSkillService.updateScore("maintainability", 5); // Should cap at 100
      expect(isolatedSkillService.getScores().maintainability).toBe(100);

      // Subsequent increments must remain clamped at 100
      const overflowResult = isolatedSkillService.updateScore("maintainability", 25);
      expect(overflowResult.oldScore).toBe(100);
      expect(overflowResult.newScore).toBe(100);
      expect(isolatedSkillService.getScores().maintainability).toBe(100);
    });

    it("strictly enforces score lower bound at 0 and never drops below zero", () => {
      const result = isolatedSkillService.updateScore("security", -100);
      expect(result.newScore).toBe(0);
      expect(isolatedSkillService.getScores().security).toBe(0);

      const furtherReduction = isolatedSkillService.updateScore("security", -50);
      expect(furtherReduction.newScore).toBe(0);
      expect(isolatedSkillService.getScores().security).toBe(0);
    });

    it("resets skill scores back to default state when requested", () => {
      isolatedSkillService.updateScore("bug-detection", 15);
      expect(isolatedSkillService.getScores()["bug-detection"]).not.toBe(
        DEFAULT_SKILL_SCORES["bug-detection"]
      );

      const resetScores = isolatedSkillService.resetScores();
      expect(resetScores).toEqual(DEFAULT_SKILL_SCORES);
      expect(isolatedSkillService.getScores()).toEqual(DEFAULT_SKILL_SCORES);
    });
  });

  // =========================================================================
  // Group 4: Review Service & Abstraction Layer
  // Requirement 4 from spec: Provider response validated before reaching UI; empty input rejected.
  // =========================================================================
  describe("Group 4: Review Service & Abstraction Layer", () => {
    it("rejects empty code input and throws an error", async () => {
      await expect(isolatedReviewService.reviewCode("")).rejects.toThrow(
        "Code snippet cannot be empty or contain only whitespace."
      );
    });

    it("rejects whitespace-only code input and throws an error", async () => {
      await expect(isolatedReviewService.reviewCode("   \n\t  \r\n")).rejects.toThrow(
        "Code snippet cannot be empty or contain only whitespace."
      );
    });

    it("coordinates with active provider and returns validated CodeReview", async () => {
      const review = await isolatedReviewService.reviewCode(DEMO_TYPESCRIPT_CODE);
      expect(review).toBeDefined();
      expect(review.summary.findingsCount).toBe(4);
      expect(review.findings).toHaveLength(4);

      // Verify returned review strictly conforms to schema
      const validation = CodeReviewSchema.safeParse(review);
      expect(validation.success).toBe(true);
    });

    it("ensures provider response is validated and rejects malformed provider responses before UI", async () => {
      const malformedProvider: ReviewProvider = {
        name: "MalformedMockProvider",
        review: async () => {
          // Simulating a provider that returns raw malformed JSON not matching CodeReviewSchema
          const rawInvalidJson = JSON.stringify({
            summary: { overallQuality: "Bad" },
            findings: [{ id: "missing-mandatory-fields" }],
          });
          return extractAndValidateJson(rawInvalidJson, CodeReviewSchema);
        },
      };

      const failingReviewService = new ReviewService(malformedProvider);

      await expect(
        failingReviewService.reviewCode("const a = 1;")
      ).rejects.toThrow();
    });

    it("allows switching active provider dynamically via setProvider", async () => {
      const customProvider: ReviewProvider = {
        name: "CustomTestProvider",
        review: async () => validSampleReview,
      };

      isolatedReviewService.setProvider(customProvider);
      expect(isolatedReviewService.getProvider().name).toBe("CustomTestProvider");

      const review = await isolatedReviewService.reviewCode("const test = true;");
      expect(review).toEqual(validSampleReview);
    });

    it("exports default singleton reviewService and allows provider coordination", () => {
      expect(reviewService).toBeInstanceOf(ReviewService);
      expect(reviewService.getProvider()).toBeDefined();
    });
  });

  // =========================================================================
  // Group 5: Mock Review Provider & Demo Code
  // Requirement 5 from spec: Returns deterministic valid CodeReview with 4 findings.
  // =========================================================================
  describe("Group 5: Mock Review Provider & Demo Code", () => {
    it("returns deterministic 4 findings matching DEMO_TYPESCRIPT_CODE across multiple calls", async () => {
      const call1 = await mockReviewProvider.review({ code: DEMO_TYPESCRIPT_CODE });
      const call2 = await mockReviewProvider.review({ code: DEMO_TYPESCRIPT_CODE });

      expect(call1).toEqual(call2);
      expect(call1.findings).toHaveLength(4);
      expect(call1.summary.findingsCount).toBe(4);
      expect(call1.summary.overallQuality).toBe("Needs Improvement");
    });

    it("ensures all 4 findings contain non-empty whyItMatters, principle, suggestion, improvedCode", async () => {
      const review = await mockReviewProvider.review({ code: DEMO_TYPESCRIPT_CODE });

      for (const finding of review.findings) {
        expect(finding.id.trim().length).toBeGreaterThan(0);
        expect(finding.title.trim().length).toBeGreaterThan(0);
        expect(finding.description.trim().length).toBeGreaterThan(10);
        expect(finding.whyItMatters.trim().length).toBeGreaterThan(10);
        expect(finding.principle.trim().length).toBeGreaterThan(5);
        expect(finding.suggestion.trim().length).toBeGreaterThan(10);
        expect(finding.affectedCode?.trim().length).toBeGreaterThan(0);
        expect(finding.improvedCode?.trim().length).toBeGreaterThan(0);
      }
    });

    it("ensures all 4 findings contain valid 3-choice challenge options with correct answer IDs", async () => {
      const review = await mockReviewProvider.review({ code: DEMO_TYPESCRIPT_CODE });

      for (const finding of review.findings) {
        const challenge = finding.challenge;
        expect(challenge.question.trim().length).toBeGreaterThan(10);
        expect(challenge.explanation.trim().length).toBeGreaterThan(10);
        expect(challenge.answers).toHaveLength(3);

        const answerIds = challenge.answers.map((a) => a.id);
        const uniqueIds = new Set(answerIds);
        expect(uniqueIds.size).toBe(3);
        expect(answerIds).toContain(challenge.correctAnswerId);

        for (const answer of challenge.answers) {
          expect(answer.id.trim().length).toBeGreaterThan(0);
          expect(answer.text.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it("validates demoCode exports valid DEMO_FILENAME and rich DEMO_TYPESCRIPT_CODE", () => {
      expect(DEMO_FILENAME).toBe("OrderService.ts");
      expect(DEMO_TYPESCRIPT_CODE).toContain("OrderService");
      expect(DEMO_TYPESCRIPT_CODE).toContain("items.find");
      expect(DEMO_TYPESCRIPT_CODE).toContain("customerId: any;");
      expect(DEMO_TYPESCRIPT_CODE).toContain("executePaymentGatewayCall");
      expect(DEMO_TYPESCRIPT_CODE).toContain("DatabasePool");
    });
  });

  // =========================================================================
  // Group 6: Full Integrated Flow
  // Simulates: code -> reviewService.reviewCode -> findings[0] ->
  // challengeService.evaluateAnswer -> skillService.updateScore -> verify score
  // =========================================================================
  describe("Group 6: Full Integrated Flow", () => {
    it("executes the complete review -> challenge -> skill score increment pipeline", async () => {
      // Step 1: Input code submitted to reviewService
      const inputCode = DEMO_TYPESCRIPT_CODE;
      const review = await isolatedReviewService.reviewCode(inputCode, "typescript");

      expect(review.findings.length).toBeGreaterThan(0);
      const targetFinding = review.findings[0]; // finding-1: type-safety

      // Step 2: Inspect finding and associated educational metadata
      expect(targetFinding.category).toBe("type-safety");
      expect(targetFinding.whyItMatters).toBeTruthy();
      expect(targetFinding.principle).toBeTruthy();
      expect(targetFinding.challenge).toBeDefined();

      // Step 3: Record initial skill score for category
      const targetSkillCategory = mapCategoryToSkillCategory(targetFinding.category);
      const initialScore = isolatedSkillService.getScores()[targetSkillCategory];

      // Step 4: User attempts challenge with the correct answer
      const challenge = targetFinding.challenge;
      const evalResult = challengeService.evaluateAnswer(
        challenge,
        challenge.correctAnswerId,
        targetFinding.category
      );

      expect(evalResult.isCorrect).toBe(true);
      expect(evalResult.skillCategory).toBe(targetSkillCategory);
      expect(evalResult.explanation).toBe(challenge.explanation);

      // Step 5: Award skill points upon correct answer
      const updateResult = isolatedSkillService.updateScore(
        evalResult.skillCategory,
        3
      );

      // Step 6: Verify updated skill score
      expect(updateResult.oldScore).toBe(initialScore);
      expect(updateResult.newScore).toBe(initialScore + 3);

      const finalScores = isolatedSkillService.getScores();
      expect(finalScores[targetSkillCategory]).toBe(initialScore + 3);
    });

    it("verifies that submitting an incorrect answer does not increment skill scores", async () => {
      // Step 1: Request review
      const review = await isolatedReviewService.reviewCode(DEMO_TYPESCRIPT_CODE);
      const targetFinding = review.findings[1]; // finding-2: bug / critical

      const targetSkillCategory = mapCategoryToSkillCategory(targetFinding.category);
      const initialScore = isolatedSkillService.getScores()[targetSkillCategory];

      // Step 2: User selects an incorrect answer
      const challenge = targetFinding.challenge;
      const incorrectOption =
        challenge.answers.find((a) => a.id !== challenge.correctAnswerId)?.id ?? "wrong-opt";

      const evalResult = challengeService.evaluateAnswer(
        challenge,
        incorrectOption,
        targetFinding.category
      );

      expect(evalResult.isCorrect).toBe(false);
      expect(evalResult.explanation).toBe(challenge.explanation);

      // Step 3: Because answer was incorrect, score update is NOT triggered
      // Verify skill score remains unchanged
      const currentScores = isolatedSkillService.getScores();
      expect(currentScores[targetSkillCategory]).toBe(initialScore);
    });

    it("supports sequential challenge completions across multiple categories accumulating skill points", async () => {
      const review = await isolatedReviewService.reviewCode(DEMO_TYPESCRIPT_CODE);

      // Complete challenges for all 4 findings in sequence
      for (const finding of review.findings) {
        const skillCat = mapCategoryToSkillCategory(finding.category);
        const scoreBefore = isolatedSkillService.getScores()[skillCat];

        const evaluation = challengeService.evaluateAnswer(
          finding.challenge,
          finding.challenge.correctAnswerId,
          finding.category
        );
        expect(evaluation.isCorrect).toBe(true);

        const scoreUpdate = isolatedSkillService.updateScore(skillCat, 3);
        expect(scoreUpdate.newScore).toBe(scoreBefore + 3);
        expect(isolatedSkillService.getScores()[skillCat]).toBe(scoreBefore + 3);
      }
    });
  });
});
