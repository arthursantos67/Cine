import { apiRequest, type PaginatedResponse } from "./client";

export type AdminSummary = {
  movieCount: number;
  nowShowingCount: number;
  roomCount: number;
  sessionsTodayCount: number;
};

export const adminApi = {
  async getSummary(): Promise<AdminSummary> {
    const today = new Date().toISOString().split("T")[0];

    const [allMovies, nowShowing, rooms, sessionsToday] = await Promise.all([
      apiRequest<PaginatedResponse<{ id: string }>>("/api/v1/catalog/movies/?page_size=1", {
        auth: "required",
      }),
      apiRequest<PaginatedResponse<{ id: string }>>(
        "/api/v1/catalog/movies/?status=em_cartaz&page_size=1",
        { auth: "required" }
      ),
      apiRequest<PaginatedResponse<{ id: string }>>(
        "/api/v1/catalog/rooms/?page_size=1",
        { auth: "required" }
      ),
      apiRequest<PaginatedResponse<{ id: string }>>(
        `/api/v1/catalog/sessions/?date=${today}&page_size=1`,
        { auth: "required" }
      ),
    ]);

    return {
      movieCount: allMovies.count,
      nowShowingCount: nowShowing.count,
      roomCount: rooms.count,
      sessionsTodayCount: sessionsToday.count,
    };
  },
};
