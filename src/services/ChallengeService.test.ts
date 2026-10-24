import { describe, it, expect } from "vitest";
import type { ReviewChallenge } from "../domain/types";
import { ChallengeService } from "./ChallengeService";

describe("ChallengeService", () => {
  const challengeService = new ChallengeService();

  const mockChallenge: ReviewChallenge = {
    question: "Why should external async calls be wrapped in try/catch?",
    answers: [
      { id: "opt-1", text: "V8 engine optimizations are disabled otherwise" },
      { id: "opt-2", text: "Network failures produce unhandled rejections" },
      { id: "opt-3", text: "fetch retries automatically" },
    ],
    correctAnswerId: "opt-2",
    explanation: "External operations can fail and need structured error handling.",
  };

  it("returns isCorrect true when selected answer matches correctAnswerId", () => {
    const result = challengeService.evaluateAnswer(
      mockChallenge,
      "opt-2",
      "bug"
    );

    expect(result).toEqual({
      isCorrect: true,
      correctAnswerId: "opt-2",
      selectedAnswerId: "opt-2",
      explanation: "External operations can fail and need structured error handling.",
      skillCategory: "bug-detection",
    });
  });

  it("returns isCorrect false when selected answer does not match correctAnswerId", () => {
    const result = challengeService.evaluateAnswer(
      mockChallenge,
      "opt-1",
      "security"
    );

    expect(result).toEqual({
      isCorrect: false,
      correctAnswerId: "opt-2",
      selectedAnswerId: "opt-1",
      explanation: "External operations can fail and need structured error handling.",
      skillCategory: "security",
    });
  });

  it("returns isCorrect false when selected answer ID is not one of the available choices", () => {
    const result = challengeService.evaluateAnswer(
      mockChallenge,
      "unrecognized-id",
      "bug"
    );

    expect(result.isCorrect).toBe(false);
    expect(result.selectedAnswerId).toBe("unrecognized-id");
  });

  it("correctly maps finding categories to their corresponding skill category", () => {
    const r1 = challengeService.evaluateAnswer(mockChallenge, "opt-2", "readability");
    expect(r1.skillCategory).toBe("maintainability");

    const r2 = challengeService.evaluateAnswer(mockChallenge, "opt-2", "performance");
    expect(r2.skillCategory).toBe("maintainability");

    const r3 = challengeService.evaluateAnswer(mockChallenge, "opt-2", "type-safety");
    expect(r3.skillCategory).toBe("type-safety");

    const r4 = challengeService.evaluateAnswer(mockChallenge, "opt-2", "testing");
    expect(r4.skillCategory).toBe("testing");
  });
});
