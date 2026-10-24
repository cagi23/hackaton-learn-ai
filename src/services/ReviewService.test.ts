import { describe, it, expect, vi } from "vitest";
import { ReviewService } from "./ReviewService";
import type { ReviewProvider } from "./providers/ReviewProvider";
import type { CodeReview } from "../domain/types";

describe("ReviewService", () => {
  const dummyReview: CodeReview = {
    summary: {
      overallQuality: "Good",
      findingsCount: 0,
    },
    findings: [],
  };

  it("defaults to a working mock provider if none is supplied", async () => {
    const service = new ReviewService();
    expect(service.getProvider()).toBeDefined();
    expect(service.getProvider().name).toBe("MockReviewProvider");

    const review = await service.reviewCode("const a = 1;");
    expect(review.summary).toBeDefined();
    expect(review.findings.length).toBeGreaterThan(0);
  });

  it("throws validation error if code is empty", async () => {
    const service = new ReviewService();
    await expect(service.reviewCode("")).rejects.toThrow(
      /empty|whitespace/i
    );
  });

  it("throws validation error if code contains only whitespace", async () => {
    const service = new ReviewService();
    await expect(service.reviewCode("   \n\t  ")).rejects.toThrow(
      /empty|whitespace/i
    );
  });

  it("dispatches review to the active provider with correct parameters", async () => {
    const mockProvider: ReviewProvider = {
      name: "CustomMockProvider",
      review: vi.fn().mockResolvedValue(dummyReview),
    };

    const service = new ReviewService(mockProvider);
    const result = await service.reviewCode("const greeting = 'hello';", "typescript");

    expect(mockProvider.review).toHaveBeenCalledWith({
      code: "const greeting = 'hello';",
      language: "typescript",
    });
    expect(result).toEqual(dummyReview);
  });

  it("supports switching providers dynamically via setProvider", async () => {
    const providerA: ReviewProvider = {
      name: "ProviderA",
      review: vi.fn().mockResolvedValue(dummyReview),
    };
    const providerB: ReviewProvider = {
      name: "ProviderB",
      review: vi.fn().mockResolvedValue({
        ...dummyReview,
        summary: { overallQuality: "Needs Improvement", findingsCount: 1 },
      }),
    };

    const service = new ReviewService(providerA);
    await service.reviewCode("test code a");
    expect(providerA.review).toHaveBeenCalledTimes(1);
    expect(providerB.review).toHaveBeenCalledTimes(0);

    service.setProvider(providerB);
    expect(service.getProvider()).toBe(providerB);

    const resultB = await service.reviewCode("test code b");
    expect(providerB.review).toHaveBeenCalledTimes(1);
    expect(resultB.summary.overallQuality).toBe("Needs Improvement");
  });

  it("propagates errors thrown by the underlying provider", async () => {
    const failingProvider: ReviewProvider = {
      name: "FailingProvider",
      review: vi.fn().mockRejectedValue(new Error("API rate limit exceeded")),
    };

    const service = new ReviewService(failingProvider);
    await expect(service.reviewCode("some code")).rejects.toThrow(
      "API rate limit exceeded"
    );
  });
});
