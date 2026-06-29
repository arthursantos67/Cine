import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogSession } from "@/types/catalog";

import {
  buildSessionDateOptions,
  formatDateForSessionQuery,
  formatSessionDateLabel,
  formatSessionFullDate,
  formatSessionPrice,
  formatSessionTime,
  getRoomDisplayName,
  getSessionBadges,
  getSessionSeatsHref,
  groupSessionsByMovie,
  groupSessionsByRoom,
  isSessionPurchasable,
} from "./session-selection";

const movie = {
  duration_minutes: 125,
  genres: [{ id: "genre-1", name: "Aventura" }],
  id: "movie-123",
  is_featured: false,
  poster_url: "https://cdn.example.com/movie.jpg",
  status: "em_cartaz" as const,
  title: "A Jornada",
};

function session(
  id: string,
  room: CatalogSession["room"],
  start_time: string,
  base_price = "42.50"
): CatalogSession {
  return {
    base_price,
    end_time: "2026-05-22T21:00:00-03:00",
    id,
    movie,
    room: {
      ...room,
    },
    start_time,
  };
}

test("session date helpers use API and Brazilian display formats", () => {
  assert.equal(
    formatDateForSessionQuery(new Date("2026-05-22T10:30:00-03:00")),
    "2026-05-22"
  );
  assert.equal(formatSessionDateLabel("2026-05-22"), "22/05");
  assert.equal(formatSessionFullDate("2026-05-22"), "22 de maio de 2026");
  assert.equal(formatSessionTime("2026-05-22T18:30:00-03:00"), "18:30");
  assert.equal(formatSessionPrice("42.50"), "R$ 42,50");
});

test("session date options keep stable YYYY-MM-DD values", () => {
  assert.deepEqual(
    buildSessionDateOptions(new Date("2026-05-22T10:30:00-03:00"), 3).map(
      (option) => option.value
    ),
    ["2026-05-22", "2026-05-23", "2026-05-24"]
  );
});

test("groupSessionsByRoom groups by room and orders sessions by time", () => {
  const groups = groupSessionsByRoom([
    session(
      "late-room-2",
      { capacity: 80, id: "room-2", name: "Sala A" },
      "2026-05-22T21:00:00-03:00"
    ),
    session(
      "late-room-1",
      {
        capacity: 80,
        display_name: "Sala VIP",
        id: "room-1",
        name: "Sala 1",
      },
      "2026-05-22T20:00:00-03:00"
    ),
    session(
      "early-room-1",
      {
        capacity: 80,
        display_name: "Sala VIP",
        id: "room-1",
        name: "Sala 1",
      },
      "2026-05-22T18:30:00-03:00"
    ),
  ]);

  assert.deepEqual(
    groups.map((group) => ({
      roomName: group.roomName,
      sessionIds: group.sessions.map((groupedSession) => groupedSession.id),
    })),
    [
      { roomName: "Sala A", sessionIds: ["late-room-2"] },
      { roomName: "Sala VIP", sessionIds: ["early-room-1", "late-room-1"] },
    ]
  );
});

test("room display names and session badges use optional metadata", () => {
  const premiumSession = session(
    "premium-session",
    {
      capacity: 48,
      display_name: "Sala VIP Prime",
      experience_type: "vip",
      id: "room-vip",
      name: "Room VIP",
    },
    "2026-05-22T18:30:00-03:00"
  );

  premiumSession.audio_format = "legendado";
  premiumSession.projection_format = "3d";
  premiumSession.session_type = "preview";

  assert.equal(getRoomDisplayName(premiumSession.room), "Sala VIP Prime");
  assert.deepEqual(
    getSessionBadges(premiumSession).map((badge) => badge.label),
    ["VIP", "3D", "Legendado", "Pré-estreia"]
  );
  assert.deepEqual(
    getSessionBadges(
      session(
        "plain",
        {
          capacity: 80,
          id: "room-plain",
          name: "Sala 1",
        },
        "2026-05-22T18:30:00-03:00"
      )
    ),
    []
  );
});

test("session navigation targets seat selection route", () => {
  assert.equal(getSessionSeatsHref("session-123"), "/sessions/session-123/seats");
});

test("isSessionPurchasable returns true when session has not yet started", () => {
  const futureSession = session(
    "future",
    { capacity: 80, id: "room-1", name: "Sala 1" },
    "2099-12-31T20:00:00-03:00"
  );
  assert.equal(isSessionPurchasable(futureSession, new Date("2026-06-22T10:00:00-03:00")), true);
});

test("isSessionPurchasable returns true when session starts in 16 minutes", () => {
  // cutoff = 17:45; now = 17:44 → now < cutoff → purchasable
  const now = new Date("2026-05-22T17:44:00-03:00");
  const soonSession = session(
    "soon",
    { capacity: 80, id: "room-1", name: "Sala 1" },
    "2026-05-22T18:00:00-03:00"
  );
  assert.equal(isSessionPurchasable(soonSession, now), true);
});

test("isSessionPurchasable returns false at exact 15-minute presale cutoff boundary", () => {
  // cutoff = 17:45; now = 17:45 → now >= cutoff → not purchasable
  const now = new Date("2026-05-22T17:45:00-03:00");
  const boundarySession = session(
    "boundary",
    { capacity: 80, id: "room-1", name: "Sala 1" },
    "2026-05-22T18:00:00-03:00"
  );
  assert.equal(isSessionPurchasable(boundarySession, now), false);
});

test("isSessionPurchasable returns false when session starts in less than 15 minutes", () => {
  // cutoff = 17:45; now = 17:46 → now > cutoff → not purchasable
  const now = new Date("2026-05-22T17:46:00-03:00");
  const imminentSession = session(
    "imminent",
    { capacity: 80, id: "room-1", name: "Sala 1" },
    "2026-05-22T18:00:00-03:00"
  );
  assert.equal(isSessionPurchasable(imminentSession, now), false);
});

test("isSessionPurchasable returns false for sessions that started hours ago", () => {
  const pastSession = session(
    "past",
    { capacity: 80, id: "room-1", name: "Sala 1" },
    "2026-05-22T18:00:00-03:00"
  );
  assert.equal(isSessionPurchasable(pastSession, new Date("2026-06-22T10:00:00-03:00")), false);
});

const movieB = {
  duration_minutes: 90,
  genres: [{ id: "genre-2", name: "Comédia" }],
  id: "movie-456",
  is_featured: false,
  poster_url: "https://cdn.example.com/movie-b.jpg",
  status: "em_cartaz" as const,
  title: "O Outro Filme",
};

test("groupSessionsByMovie groups sessions by movie preserving room order within each movie", () => {
  const groups = groupSessionsByMovie([
    session("s1", { capacity: 80, id: "room-1", name: "Sala 1" }, "2026-05-22T18:00:00-03:00"),
    session("s2", { capacity: 80, id: "room-1", name: "Sala 1" }, "2026-05-22T20:00:00-03:00"),
    {
      ...session("s3", { capacity: 48, id: "room-vip", name: "Sala VIP" }, "2026-05-22T19:00:00-03:00"),
      movie: movieB,
    },
    session("s4", { capacity: 48, id: "room-2", name: "Sala 2" }, "2026-05-22T21:00:00-03:00"),
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].movie.id, "movie-123");
  assert.deepEqual(
    groups[0].roomGroups.map((g) => g.roomId),
    ["room-1", "room-2"]
  );
  assert.deepEqual(
    groups[0].roomGroups[0].sessions.map((s) => s.id),
    ["s1", "s2"]
  );
  assert.equal(groups[1].movie.id, "movie-456");
  assert.equal(groups[1].roomGroups.length, 1);
  assert.equal(groups[1].roomGroups[0].sessions[0].id, "s3");
});

test("groupSessionsByMovie returns empty array for empty input", () => {
  assert.deepEqual(groupSessionsByMovie([]), []);
});

test("groupSessionsByMovie returns single group for single movie", () => {
  const groups = groupSessionsByMovie([
    session("s1", { capacity: 80, id: "room-1", name: "Sala 1" }, "2026-05-22T18:00:00-03:00"),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].movie.id, "movie-123");
  assert.equal(groups[0].roomGroups[0].sessions[0].id, "s1");
});
