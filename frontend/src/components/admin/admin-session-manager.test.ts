import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "@/api/client";
import { extractSessionFieldErrors } from "./AdminSessionForm";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const sessionMovie = {
  age_rating: null,
  cast: null,
  director: null,
  duration_minutes: 120,
  genres: [{ id: "genre-1", name: "Ação" }],
  id: "movie-1",
  is_featured: false,
  poster_url: "https://cdn.example.com/poster.jpg",
  release_date: "2026-06-01",
  status: "em_cartaz",
  title: "Filme Teste",
};

const sessionRoom = {
  capacity: 100,
  description: null,
  display_name: "Sala VIP Prime",
  experience_type: "vip",
  id: "room-1",
  name: "Sala 1",
};

const session = {
  audio_format: "legendado",
  base_price: "54.00",
  end_time: "2026-06-10T22:00:00Z",
  has_purchases: false,
  has_reservations: false,
  id: "session-1",
  movie: sessionMovie,
  projection_format: "3d",
  room: sessionRoom,
  session_type: "preview",
  start_time: "2026-06-10T19:30:00Z",
};

const paginatedSessions = {
  count: 1,
  next: null,
  previous: null,
  results: [session],
};

// ─── extractSessionFieldErrors ────────────────────────────────────────────────

test("extractSessionFieldErrors returns empty object for non-ApiError", () => {
  assert.deepEqual(extractSessionFieldErrors(new Error("network")), {});
  assert.deepEqual(extractSessionFieldErrors(null), {});
  assert.deepEqual(extractSessionFieldErrors(undefined), {});
});

test("extractSessionFieldErrors returns empty for non-validation ApiError", () => {
  const error = new ApiError("Not found", 404, {
    code: "RESOURCE_NOT_FOUND",
    details: { movie: ["Required."] },
  });
  assert.deepEqual(extractSessionFieldErrors(error), {});
});

test("extractSessionFieldErrors extracts field errors from VALIDATION_FAILED", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      base_price: ["Este campo é obrigatório."],
      end_time: ["O horário de fim deve ser após o início."],
      movie: ["Selecione um filme válido."],
    },
  });
  const result = extractSessionFieldErrors(error);
  assert.equal(result.base_price, "Este campo é obrigatório.");
  assert.equal(result.end_time, "O horário de fim deve ser após o início.");
  assert.equal(result.movie, "Selecione um filme válido.");
});

test("extractSessionFieldErrors joins multiple messages per field", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      start_time: ["Campo obrigatório.", "Formato inválido."],
    },
  });
  const result = extractSessionFieldErrors(error);
  assert.equal(result.start_time, "Campo obrigatório. Formato inválido.");
});

test("extractSessionFieldErrors handles non_field_errors", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      non_field_errors: ["A sessão conflita com outra sessão na mesma sala."],
    },
  });
  assert.equal(
    extractSessionFieldErrors(error).non_field_errors,
    "A sessão conflita com outra sessão na mesma sala."
  );
});

// ─── adminApi.listSessions ─ integration-style ────────────────────────────────

import { adminApi } from "@/api/admin";

test("adminApi.listSessions returns sessions with movie and room", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json(paginatedSessions);
    const result = await adminApi.listSessions();
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].movie.title, "Filme Teste");
    assert.equal(result.results[0].room.id, "room-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.listSessions supports date, movie, and room filters", async () => {
  const originalFetch = globalThis.fetch;
  let captured = "";
  try {
    globalThis.fetch = async (input) => {
      captured = String(input);
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    };
    await adminApi.listSessions({
      date: "2026-06-10",
      movie: "movie-1",
      room: "room-1",
    });
    assert.match(captured, /date=2026-06-10/);
    assert.match(captured, /movie=movie-1/);
    assert.match(captured, /room=room-1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.createSession includes all metadata fields", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_input, init) => {
      const body = JSON.parse(init?.body as string);
      assert.equal(body.audio_format, "legendado");
      assert.equal(body.projection_format, "3d");
      assert.equal(body.session_type, "preview");
      assert.equal(body.base_price, "54.00");
      return Response.json(session);
    };
    await adminApi.createSession({
      audio_format: "legendado",
      base_price: "54.00",
      end_time: "2026-06-10T22:00:00Z",
      movie: "movie-1",
      projection_format: "3d",
      room: "room-1",
      session_type: "preview",
      start_time: "2026-06-10T19:30:00Z",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.updateSession only sends the changed field", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_input, init) => {
      const body = JSON.parse(init?.body as string);
      assert.deepEqual(Object.keys(body), ["audio_format"]);
      return Response.json({ ...session, audio_format: "dublado" });
    };
    await adminApi.updateSession("session-1", { audio_format: "dublado" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.deleteSession does not throw on 204 response", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(null, { status: 204 });
    await assert.doesNotReject(adminApi.deleteSession("session-1"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.getSession rejects when movie or room is missing", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      Response.json({
        base_price: "54.00",
        end_time: "2026-06-10T22:00:00Z",
        id: "session-1",
        start_time: "2026-06-10T19:30:00Z",
      });
    await assert.rejects(
      adminApi.getSession("session-1"),
      /Unexpected admin session detail response/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
