export type FindingCategory =
  | "bug"
  | "security"
  | "maintainability"
  | "type-safety"
  | "testing"
  | "performance"
  | "readability";

export type FindingSeverity = "critical" | "high" | "medium" | "low";

export type SkillCategory =
  | "bug-detection"
  | "security"
  | "maintainability"
  | "type-safety"
  | "testing";

export type SkillScores = Record<SkillCategory, number>;

export interface ChallengeAnswer {
  id: string;
  text: string;
}

export interface ReviewChallenge {
  question: string;
  code?: string;
  answers: ChallengeAnswer[];
  correctAnswerId: string;
  explanation: string;
}

export interface ReviewFinding {
  id: string;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  affectedCode?: string;
  description: string;
  whyItMatters: string;
  principle: string;
  suggestion: string;
  improvedCode?: string;
  challenge: ReviewChallenge;
}

export interface CodeReviewSummary {
  overallQuality: string;
  findingsCount: number;
}

export interface CodeReview {
  summary: CodeReviewSummary;
  findings: ReviewFinding[];
}

export interface ReviewRequest {
  code: string;
  language?: string;
}
