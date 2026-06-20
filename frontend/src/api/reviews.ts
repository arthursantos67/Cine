import type { MovieReview, MovieReviewsPage } from "@/types/catalog";
import { apiRequest } from "./client";

export type SubmitReviewPayload = {
  rating: number;
  comment?: string;
};

const reviewsPath = (movieId: string) =>
  `/api/v1/catalog/movies/${movieId}/reviews/`;

const reviewDetailPath = (movieId: string, reviewId: string) =>
  `/api/v1/catalog/movies/${movieId}/reviews/${reviewId}/`;

export const reviewsApi = {
  listReviews(movieId: string, page = 1): Promise<MovieReviewsPage> {
    const path = page > 1
      ? `${reviewsPath(movieId)}?page=${page}`
      : reviewsPath(movieId);
    return apiRequest<MovieReviewsPage>(path, { auth: "none", method: "GET" });
  },

  submitReview(movieId: string, payload: SubmitReviewPayload): Promise<MovieReview> {
    return apiRequest<MovieReview>(reviewsPath(movieId), {
      auth: "required",
      method: "POST",
      json: payload,
    });
  },

  deleteReview(movieId: string, reviewId: string): Promise<null> {
    return apiRequest<null>(reviewDetailPath(movieId, reviewId), {
      auth: "required",
      method: "DELETE",
    });
  },
};
