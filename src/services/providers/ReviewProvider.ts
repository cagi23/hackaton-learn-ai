import type { CodeReview, ReviewRequest } from "../../domain/types";

export interface ReviewProvider {
  readonly name: string;
  review(request: ReviewRequest): Promise<CodeReview>;
}
