import type {
  FindingCategory,
  ReviewChallenge,
  SkillCategory,
} from "../domain/types";
import { mapCategoryToSkillCategory } from "./SkillService";

export interface ChallengeEvaluationResult {
  isCorrect: boolean;
  correctAnswerId: string;
  selectedAnswerId: string;
  explanation: string;
  skillCategory: SkillCategory;
}

export class ChallengeService {
  /**
   * Deterministically evaluates a challenge submission against its correctAnswerId.
   */
  evaluateAnswer(
    challenge: ReviewChallenge,
    selectedAnswerId: string,
    category: FindingCategory
  ): ChallengeEvaluationResult {
    const isValidOption = challenge.answers.some((a) => a.id === selectedAnswerId);
    const isCorrect = isValidOption && selectedAnswerId === challenge.correctAnswerId;
    const skillCategory = mapCategoryToSkillCategory(category);

    return {
      isCorrect,
      correctAnswerId: challenge.correctAnswerId,
      selectedAnswerId,
      explanation: challenge.explanation,
      skillCategory,
    };
  }
}

export const challengeService = new ChallengeService();
