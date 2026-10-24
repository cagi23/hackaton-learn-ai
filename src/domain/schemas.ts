import { z } from "zod";

export const FindingCategorySchema = z.enum([
  "bug",
  "security",
  "maintainability",
  "type-safety",
  "testing",
  "performance",
  "readability",
]);

export const FindingSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

export const SkillCategorySchema = z.enum([
  "bug-detection",
  "security",
  "maintainability",
  "type-safety",
  "testing",
]);

export const SkillScoresSchema = z.record(
  SkillCategorySchema,
  z.number().min(0).max(100)
);

export const ChallengeAnswerSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const ReviewChallengeSchema = z
  .object({
    question: z.string().min(1),
    code: z.string().optional(),
    answers: z.array(ChallengeAnswerSchema).min(2).max(4),
    correctAnswerId: z.string().min(1),
    explanation: z.string().min(1),
  })
  .refine((data) => data.answers.some((a) => a.id === data.correctAnswerId), {
    message: "correctAnswerId must match one of the answers",
    path: ["correctAnswerId"],
  })
  .refine(
    (data) => {
      const ids = data.answers.map((a) => a.id);
      return new Set(ids).size === ids.length;
    },
    {
      message: "Answer IDs must be unique within a challenge",
      path: ["answers"],
    }
  );

export const ReviewFindingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: FindingCategorySchema,
  severity: FindingSeveritySchema,
  affectedCode: z.string().optional(),
  description: z.string().min(1),
  whyItMatters: z.string().min(1),
  principle: z.string().min(1),
  suggestion: z.string().min(1),
  improvedCode: z.string().optional(),
  challenge: ReviewChallengeSchema,
});

export const CodeReviewSummarySchema = z.object({
  overallQuality: z.string().min(1),
  findingsCount: z.number().int().nonnegative(),
});

export const CodeReviewSchema = z
  .object({
    summary: CodeReviewSummarySchema,
    findings: z.array(ReviewFindingSchema),
  })
  .refine(
    (data) => {
      const ids = data.findings.map((f) => f.id);
      return new Set(ids).size === ids.length;
    },
    {
      message: "Finding IDs must be unique",
      path: ["findings"],
    }
  );

export const ReviewRequestSchema = z.object({
  code: z.string().min(1),
  language: z.string().optional(),
});
