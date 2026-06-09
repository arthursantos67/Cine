import type { MovieInterestStatus } from "@/types/catalog";

import { apiRequest } from "./client";

function interestPath(movieId: string) {
  return `/api/v1/catalog/movies/${movieId}/interest/`;
}

function isMovieInterestStatus(value: unknown): value is MovieInterestStatus {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).count === "number" &&
    ((value as Record<string, unknown>).user_interested === null ||
      typeof (value as Record<string, unknown>).user_interested === "boolean")
  );
}

export const interestApi = {
  getMovieInterest(movieId: string) {
    return getMovieInterest(movieId);
  },

  markMovieInterest(movieId: string) {
    return markMovieInterest(movieId);
  },

  unmarkMovieInterest(movieId: string) {
    return unmarkMovieInterest(movieId);
  },
};

async function getMovieInterest(movieId: string): Promise<MovieInterestStatus> {
  const response = await apiRequest<unknown>(interestPath(movieId), {
    auth: "optional",
    method: "GET",
  });

  if (!isMovieInterestStatus(response)) {
    throw new Error("Unexpected movie interest response.");
  }

  return response;
}

async function markMovieInterest(movieId: string): Promise<MovieInterestStatus> {
  const response = await apiRequest<unknown>(interestPath(movieId), {
    auth: "required",
    method: "POST",
  });

  if (!isMovieInterestStatus(response)) {
    throw new Error("Unexpected movie interest response.");
  }

  return response;
}

async function unmarkMovieInterest(movieId: string): Promise<void> {
  await apiRequest<void>(interestPath(movieId), {
    auth: "required",
    method: "DELETE",
  });
}
