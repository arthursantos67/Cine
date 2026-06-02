import type {
  AdminRoom,
  AdminSeat,
  AdminSeatRow,
  CatalogGenre,
  CatalogMovieAgeRating,
  CatalogMovieDetail,
  CatalogRoomExperienceType,
  MovieStatus,
} from "@/types/catalog";

import {
  apiRequest,
  isPaginatedResponse,
  type PaginatedResponse,
} from "./client";

export type AdminSummary = {
  movieCount: number;
  nowShowingCount: number;
  roomCount: number;
  sessionsTodayCount: number;
};

export type AdminMovieWritePayload = {
  age_rating?: CatalogMovieAgeRating;
  cast?: string[];
  director?: string;
  duration_minutes: number;
  genres: string[];
  is_featured?: boolean;
  poster_url: string;
  release_date: string;
  status: MovieStatus;
  synopsis: string;
  title: string;
};

export type AdminGenreWritePayload = {
  name: string;
};

export type AdminRoomWritePayload = {
  capacity: number;
  description?: string;
  display_name?: string;
  experience_type?: CatalogRoomExperienceType;
  name: string;
};

export type AdminSeatRowWritePayload = {
  name: string;
  room: string;
};

export type AdminSeatWritePayload = {
  is_accessible?: boolean;
  number: number;
  row: string;
};

export type AdminGenre = CatalogGenre & {
  created_at?: string;
  updated_at?: string;
};

const MOVIES_PATH = "/api/v1/catalog/movies/";
const GENRES_PATH = "/api/v1/catalog/genres/";
const ROOMS_PATH = "/api/v1/catalog/rooms/";
const SEAT_ROWS_PATH = "/api/v1/reservation/seat-rows/";
const SEATS_PATH = "/api/v1/reservation/seats/";

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

  async listMovies(params: { page?: number; search?: string; status?: MovieStatus } = {}) {
    const response = await apiRequest<unknown>(buildMoviesPath(params), {
      auth: "required",
      method: "GET",
    });

    if (!isPaginatedResponse<CatalogMovieDetail>(response)) {
      throw new Error("Unexpected admin movie list response.");
    }

    return response satisfies PaginatedResponse<CatalogMovieDetail>;
  },

  async getMovie(movieId: string) {
    const response = await apiRequest<unknown>(`${MOVIES_PATH}${movieId}/`, {
      auth: "required",
      method: "GET",
    });

    if (!isAdminMovieDetail(response)) {
      throw new Error("Unexpected admin movie detail response.");
    }

    return response satisfies CatalogMovieDetail;
  },

  async createMovie(payload: AdminMovieWritePayload) {
    const response = await apiRequest<unknown>(MOVIES_PATH, {
      auth: "required",
      json: payload,
      method: "POST",
    });

    if (!isAdminMovieDetail(response)) {
      throw new Error("Unexpected admin create movie response.");
    }

    return response satisfies CatalogMovieDetail;
  },

  async updateMovie(movieId: string, payload: Partial<AdminMovieWritePayload>) {
    const response = await apiRequest<unknown>(`${MOVIES_PATH}${movieId}/`, {
      auth: "required",
      json: payload,
      method: "PATCH",
    });

    if (!isAdminMovieDetail(response)) {
      throw new Error("Unexpected admin update movie response.");
    }

    return response satisfies CatalogMovieDetail;
  },

  async deleteMovie(movieId: string) {
    await apiRequest<unknown>(`${MOVIES_PATH}${movieId}/`, {
      auth: "required",
      method: "DELETE",
    });
  },

  async listGenres(params: { page?: number } = {}) {
    const query = params.page !== undefined ? `?page=${params.page}` : "";
    const response = await apiRequest<unknown>(`${GENRES_PATH}${query}`, {
      auth: "required",
      method: "GET",
    });

    if (!isPaginatedResponse<AdminGenre>(response)) {
      throw new Error("Unexpected admin genre list response.");
    }

    return response satisfies PaginatedResponse<AdminGenre>;
  },

  async createGenre(payload: AdminGenreWritePayload) {
    const response = await apiRequest<unknown>(GENRES_PATH, {
      auth: "required",
      json: payload,
      method: "POST",
    });

    if (!isAdminGenre(response)) {
      throw new Error("Unexpected admin create genre response.");
    }

    return response satisfies AdminGenre;
  },

  async updateGenre(genreId: string, payload: AdminGenreWritePayload) {
    const response = await apiRequest<unknown>(`${GENRES_PATH}${genreId}/`, {
      auth: "required",
      json: payload,
      method: "PATCH",
    });

    if (!isAdminGenre(response)) {
      throw new Error("Unexpected admin update genre response.");
    }

    return response satisfies AdminGenre;
  },

  async deleteGenre(genreId: string) {
    await apiRequest<unknown>(`${GENRES_PATH}${genreId}/`, {
      auth: "required",
      method: "DELETE",
    });
  },

  async listRooms(params: { page?: number; search?: string } = {}) {
    const query = buildQueryString(params);
    const response = await apiRequest<unknown>(
      query ? `${ROOMS_PATH}?${query}` : ROOMS_PATH,
      { auth: "required", method: "GET" }
    );

    if (!isPaginatedResponse<AdminRoom>(response)) {
      throw new Error("Unexpected admin room list response.");
    }

    return response satisfies PaginatedResponse<AdminRoom>;
  },

  async getRoom(roomId: string) {
    const response = await apiRequest<unknown>(`${ROOMS_PATH}${roomId}/`, {
      auth: "required",
      method: "GET",
    });

    if (!isAdminRoom(response)) {
      throw new Error("Unexpected admin room detail response.");
    }

    return response satisfies AdminRoom;
  },

  async createRoom(payload: AdminRoomWritePayload) {
    const response = await apiRequest<unknown>(ROOMS_PATH, {
      auth: "required",
      json: payload,
      method: "POST",
    });

    if (!isAdminRoom(response)) {
      throw new Error("Unexpected admin create room response.");
    }

    return response satisfies AdminRoom;
  },

  async updateRoom(roomId: string, payload: Partial<AdminRoomWritePayload>) {
    const response = await apiRequest<unknown>(`${ROOMS_PATH}${roomId}/`, {
      auth: "required",
      json: payload,
      method: "PATCH",
    });

    if (!isAdminRoom(response)) {
      throw new Error("Unexpected admin update room response.");
    }

    return response satisfies AdminRoom;
  },

  async deleteRoom(roomId: string) {
    await apiRequest<unknown>(`${ROOMS_PATH}${roomId}/`, {
      auth: "required",
      method: "DELETE",
    });
  },

  async listAllSeatRows(roomId: string): Promise<AdminSeatRow[]> {
    const all = await fetchAllPages<AdminSeatRow>(SEAT_ROWS_PATH, isAdminSeatRow);
    return all.filter((row) => row.room === roomId);
  },

  async createSeatRow(payload: AdminSeatRowWritePayload) {
    const response = await apiRequest<unknown>(SEAT_ROWS_PATH, {
      auth: "required",
      json: payload,
      method: "POST",
    });

    if (!isAdminSeatRow(response)) {
      throw new Error("Unexpected admin create seat row response.");
    }

    return response satisfies AdminSeatRow;
  },

  async deleteSeatRow(seatRowId: string) {
    await apiRequest<unknown>(`${SEAT_ROWS_PATH}${seatRowId}/`, {
      auth: "required",
      method: "DELETE",
    });
  },

  async listAllSeats(rowId: string): Promise<AdminSeat[]> {
    const all = await fetchAllPages<AdminSeat>(SEATS_PATH, isAdminSeat);
    return all.filter((seat) => seat.row === rowId);
  },

  async createSeat(payload: AdminSeatWritePayload) {
    const response = await apiRequest<unknown>(SEATS_PATH, {
      auth: "required",
      json: payload,
      method: "POST",
    });

    if (!isAdminSeat(response)) {
      throw new Error("Unexpected admin create seat response.");
    }

    return response satisfies AdminSeat;
  },

  async updateSeat(seatId: string, payload: Partial<AdminSeatWritePayload>) {
    const response = await apiRequest<unknown>(`${SEATS_PATH}${seatId}/`, {
      auth: "required",
      json: payload,
      method: "PATCH",
    });

    if (!isAdminSeat(response)) {
      throw new Error("Unexpected admin update seat response.");
    }

    return response satisfies AdminSeat;
  },

  async deleteSeat(seatId: string) {
    await apiRequest<unknown>(`${SEATS_PATH}${seatId}/`, {
      auth: "required",
      method: "DELETE",
    });
  },
};

function buildMoviesPath({
  page,
  search,
  status,
}: {
  page?: number;
  search?: string;
  status?: MovieStatus;
}) {
  const searchParams = new URLSearchParams();

  if (status) {
    searchParams.set("status", status);
  }

  if (search) {
    searchParams.set("search", search);
  }

  if (page !== undefined) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `${MOVIES_PATH}?${query}` : MOVIES_PATH;
}

function buildQueryString(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

async function fetchAllPages<T>(
  path: string,
  filter?: (item: unknown) => item is T
): Promise<T[]> {
  const first = await apiRequest<PaginatedResponse<unknown>>(path, {
    auth: "required",
    method: "GET",
  });

  const allItems: T[] = [];

  function collectFiltered(items: unknown[]) {
    for (const item of items) {
      if (!filter || filter(item)) {
        allItems.push(item as T);
      }
    }
  }

  collectFiltered(first.results);

  let nextUrl: string | null = first.next;

  while (nextUrl) {
    const page = await apiRequest<PaginatedResponse<unknown>>(nextUrl, {
      auth: "required",
      method: "GET",
    });

    collectFiltered(page.results);
    nextUrl = page.next;
  }

  return allItems;
}

function isAdminRoom(value: unknown): value is AdminRoom {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.capacity === "number"
  );
}

function isAdminSeatRow(value: unknown): value is AdminSeatRow {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.room === "string"
  );
}

function isAdminSeat(value: unknown): value is AdminSeat {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.row === "string" &&
    typeof value.number === "number" &&
    typeof value.is_accessible === "boolean"
  );
}

function isAdminMovieDetail(value: unknown): value is CatalogMovieDetail {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    Array.isArray(value.genres) &&
    typeof value.duration_minutes === "number" &&
    typeof value.poster_url === "string" &&
    isMovieStatus(value.status) &&
    typeof value.is_featured === "boolean" &&
    typeof value.synopsis === "string"
  );
}

function isAdminGenre(value: unknown): value is AdminGenre {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isMovieStatus(value: unknown): value is MovieStatus {
  return value === "em_cartaz" || value === "pre_venda" || value === "em_breve";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
