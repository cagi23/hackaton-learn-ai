import type { CodeReview } from "../domain/types";
import type { ReviewProvider } from "./providers/ReviewProvider";
import { MockReviewProvider } from "./providers/MockReviewProvider";

export class ReviewService {
  private provider: ReviewProvider;

  constructor(initialProvider?: ReviewProvider) {
    this.provider = initialProvider ?? new MockReviewProvider();
  }

  /**
   * Retrieves the current active ReviewProvider.
   */
  getProvider(): ReviewProvider {
    return this.provider;
  }

  /**
   * Switches the active ReviewProvider (e.g. MockReviewProvider vs LLMReviewProvider).
   */
  setProvider(provider: ReviewProvider): void {
    this.provider = provider;
  }

  /**
   * Validates input code and dispatches a review request to the active provider.
   */
  async reviewCode(code: string, language?: string): Promise<CodeReview> {
    if (!code || !code.trim()) {
      throw new Error("Code snippet cannot be empty or contain only whitespace.");
    }

    return this.provider.review({
      code,
      language,
    });
  }
}

export const reviewService = new ReviewService();
