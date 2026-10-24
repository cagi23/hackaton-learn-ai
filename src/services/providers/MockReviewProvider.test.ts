import { describe, it, expect } from "vitest";
import { MockReviewProvider } from "./MockReviewProvider";
import { CodeReviewSchema } from "../../domain/schemas";
import { DEMO_TYPESCRIPT_CODE, DEMO_FILENAME } from "../../data/demoCode";

describe("MockReviewProvider", () => {
  it("has a valid provider name", () => {
    const provider = new MockReviewProvider();
    expect(provider.name).toBe("MockReviewProvider");
  });

  it("returns a deterministic review matching CodeReviewSchema", async () => {
    const provider = new MockReviewProvider();
    const result1 = await provider.review({ code: DEMO_TYPESCRIPT_CODE });
    const result2 = await provider.review({ code: DEMO_TYPESCRIPT_CODE });

    // Schema validation
    const parsed = CodeReviewSchema.safeParse(result1);
    expect(parsed.success).toBe(true);

    // Deterministic check
    expect(result1).toEqual(result2);

    // Summary checks
    expect(result1.summary.overallQuality).toBe("Needs Improvement");
    expect(result1.summary.findingsCount).toBe(4);
    expect(result1.findings).toHaveLength(4);
  });

  it("contains all 4 required findings with exact categories, severities, and principles", async () => {
    const provider = new MockReviewProvider();
    const result = await provider.review({ code: DEMO_TYPESCRIPT_CODE });

    const [f1, f2, f3, f4] = result.findings;

    // Finding 1: Unsafe undefined access on items.find(...)
    expect(f1.category).toBe("type-safety");
    expect(f1.severity).toBe("high");
    expect(f1.principle).toBe("Null Safety & Defensive Checks");
    expect(f1.title).toMatch(/undefined|null/i);

    // Finding 2: Unhandled async payment failure
    expect(f2.category).toBe("bug");
    expect(f2.severity).toBe("critical");
    expect(f2.principle).toBe("Fail-Fast & Explicit Error Handling");
    expect(f2.title).toMatch(/payment|async|error/i);

    // Finding 3: Mixed persistence & business logic
    expect(f3.category).toBe("maintainability");
    expect(f3.severity).toBe("medium");
    expect(f3.principle).toBe("Single Responsibility Principle (SRP)");
    expect(f3.title).toMatch(/responsibility|srp|persistence/i);

    // Finding 4: Insecure customer ID handling without type validation
    expect(f4.category).toBe("security");
    expect(f4.severity).toBe("medium");
    expect(f4.principle).toBe("Input Validation & Boundary Checking");
    expect(f4.title).toMatch(/validation|customer|input/i);
  });

  it("ensures every finding has educational metadata and valid challenge options", async () => {
    const provider = new MockReviewProvider();
    const result = await provider.review({ code: DEMO_TYPESCRIPT_CODE });

    for (const finding of result.findings) {
      expect(finding.id).toBeTruthy();
      expect(finding.title).toBeTruthy();
      expect(finding.whyItMatters.trim().length).toBeGreaterThan(20);
      expect(finding.principle.trim().length).toBeGreaterThan(5);
      expect(finding.suggestion.trim().length).toBeGreaterThan(10);
      expect(finding.affectedCode).toBeTruthy();
      expect(finding.improvedCode).toBeTruthy();

      const challenge = finding.challenge;
      expect(challenge.question.trim().length).toBeGreaterThan(10);
      expect(challenge.explanation.trim().length).toBeGreaterThan(20);
      expect(challenge.answers).toHaveLength(3);

      const answerIds = challenge.answers.map((a) => a.id);
      expect(answerIds).toEqual(["opt-1", "opt-2", "opt-3"]);
      expect(new Set(answerIds).size).toBe(3);
      expect(answerIds).toContain(challenge.correctAnswerId);
    }
  });
});

describe("demoCode", () => {
  it("exports valid DEMO_FILENAME and non-empty DEMO_TYPESCRIPT_CODE containing expected defects", () => {
    expect(DEMO_FILENAME).toBe("OrderService.ts");
    expect(typeof DEMO_TYPESCRIPT_CODE).toBe("string");
    expect(DEMO_TYPESCRIPT_CODE.length).toBeGreaterThan(100);

    // Defect 1: Unsafe undefined access (items.find)
    expect(DEMO_TYPESCRIPT_CODE).toContain("items.find");

    // Defect 2: Weak typing / any usage
    expect(DEMO_TYPESCRIPT_CODE).toMatch(/any|as\s+any/);

    // Defect 3: Mixed persistence / connection string / DB responsibility
    expect(DEMO_TYPESCRIPT_CODE).toMatch(/DATABASE_URL|connection|query|INSERT INTO/i);

    // Defect 4: Async payment / unhandled error handling
    expect(DEMO_TYPESCRIPT_CODE).toMatch(/payment|processPayment/i);
  });
});
