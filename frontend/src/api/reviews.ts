import type { MovieReview, MovieReviewVoteValue, MovieReviewsPage } from "@/types/catalog";
import { apiRequest } from "./client";

export type SubmitReviewPayload = {
  rating: number;
  comment?: string;
};

const reviewsPath = (movieId: string) =>
  `/api/v1/catalog/movies/${movieId}/reviews/`;

const reviewDetailPath = (movieId: string, reviewId: string) =>
  `/api/v1/catalog/movies/${movieId}/reviews/${reviewId}/`;

const reviewVotePath = (movieId: string, reviewId: string) =>
  `/api/v1/catalog/movies/${movieId}/reviews/${reviewId}/vote/`;

export const reviewsApi = {
  listReviews(movieId: string, page = 1, rating?: number): Promise<MovieReviewsPage> {
    let path = reviewsPath(movieId);
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (rating !== undefined) params.set("rating", String(rating));
    const qs = params.toString();
    if (qs) path += `?${qs}`;
    return apiRequest<MovieReviewsPage>(path, { auth: "optional", method: "GET" });
  },

  submitReview(movieId: string, payload: SubmitReviewPayload): Promise<MovieReview> {
    return apiRequest<MovieReview>(reviewsPath(movieId), {
      auth: "required",
      method: "POST",
      json: payload,
    });
  },

  updateReview(movieId: string, reviewId: string, payload: Partial<SubmitReviewPayload>): Promise<MovieReview> {
    return apiRequest<MovieReview>(reviewDetailPath(movieId, reviewId), {
      auth: "required",
      method: "PATCH",
      json: payload,
    });
  },

  deleteReview(movieId: string, reviewId: string): Promise<null> {
    return apiRequest<null>(reviewDetailPath(movieId, reviewId), {
      auth: "required",
      method: "DELETE",
    });
  },

  voteReview(movieId: string, reviewId: string, vote: MovieReviewVoteValue): Promise<{ vote: MovieReviewVoteValue }> {
    return apiRequest<{ vote: MovieReviewVoteValue }>(reviewVotePath(movieId, reviewId), {
      auth: "required",
      method: "POST",
      json: { vote },
    });
  },

  removeVote(movieId: string, reviewId: string): Promise<null> {
    return apiRequest<null>(reviewVotePath(movieId, reviewId), {
      auth: "required",
      method: "DELETE",
    });
  },
};
