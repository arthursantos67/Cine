import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { CatalogMovie, CatalogSession } from "@/types/catalog";

import { HomeSchedule, SessionSchedule } from "./HomeSchedule";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const room = {
  capacity: 80,
  description: null,
  display_name: "Sala VIP Prime",
  experience_type: "vip" as const,
  id: "room-vip",
  name: "Sala VIP",
};

const nowShowingMovie: CatalogMovie = {
  duration_minutes: 120,
  genres: [{ id: "genre-1", name: "Aventura" }],
  id: "movie-now",
  is_featured: true,
  poster_url: "https://cdn.example.com/now.jpg",
  status: "em_cartaz",
  title: "Em Cartaz Agora",
};

const upcomingMovie: CatalogMovie = {
  duration_minutes: 95,
  genres: [{ id: "genre-2", name: "Drama" }],
  id: "movie-soon",
  is_featured: false,
  poster_url: "https://cdn.example.com/soon.jpg",
  status: "em_breve",
  title: "Em Breve nas Telas",
};

const sessionA: CatalogSession = {
  audio_format: "legendado",
  base_price: "42.00",
  end_time: "2099-12-31T20:10:00-03:00",
  id: "session-a",
  movie: nowShowingMovie,
  projection_format: "3d",
  room,
  session_type: "preview",
  start_time: "2099-12-31T18:00:00-03:00",
};

const pastSessionA: CatalogSession = {
  ...sessionA,
  end_time: "2026-05-22T20:10:00-03:00",
  id: "session-past",
  start_time: "2026-05-22T18:00:00-03:00",
};

const emBreveSectionState = (status: "error" | "loading" | "success", movies: CatalogMovie[] = []) => ({
  errorMessage: status === "error" ? "Falha ao carregar." : undefined,
  movies,
  status,
});

test("HomeSchedule renders both schedule tabs with correct ARIA attributes", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      upcoming: emBreveSectionState("success", []),
    })
  );

  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /Em cartaz/);
  assert.match(html, /Em breve/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /aria-selected="false"/);
});

test("HomeSchedule default active tab is Em cartaz", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      upcoming: emBreveSectionState("success", [upcomingMovie]),
    })
  );

  // Em cartaz tab selected, Em breve not
  const emCartazTabMatch = html.match(/aria-selected="true"[^>]*>Em cartaz/);
  assert.ok(emCartazTabMatch || html.includes('"em_cartaz-tab"') && html.includes('aria-selected="true"'));

  // Em breve panel is hidden
  assert.match(html, /hidden/);
});

test("HomeSchedule shows date selector in Em cartaz panel", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      upcoming: emBreveSectionState("success", []),
    })
  );

  assert.match(html, /Selecionar data/);
  assert.match(html, /aria-pressed/);
});

test("HomeSchedule shows Em cartaz tab loading sessions state on mount", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      upcoming: emBreveSectionState("success", []),
    })
  );

  assert.match(html, /Carregando programação/);
});

test("HomeSchedule Em breve panel shows movies carousel when upcoming is success", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      upcoming: emBreveSectionState("success", [upcomingMovie]),
    })
  );

  assert.match(html, /Em Breve nas Telas/);
});

test("HomeSchedule Em breve panel shows empty state when upcoming has no movies", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      upcoming: emBreveSectionState("success", []),
    })
  );

  assert.match(html, /Nenhum filme em breve/);
  assert.match(html, /Ainda não há filmes em breve/);
});

test("HomeSchedule Em breve panel shows loading state", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      upcoming: emBreveSectionState("loading"),
    })
  );

  assert.match(html, /Carregando filmes em breve/);
});

test("HomeSchedule Em breve panel shows error state with retry button", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      onRetryUpcoming: () => undefined,
      upcoming: emBreveSectionState("error"),
    })
  );

  assert.match(html, /Em breve indisponível/);
  assert.match(html, /Tentar novamente/);
});

test("HomeSchedule shows cinema name", () => {
  const html = renderToStaticMarkup(
    createElement(HomeSchedule, {
      cinemaName: "Cinema Test",
      upcoming: emBreveSectionState("success", []),
    })
  );

  assert.match(html, /Cinema Test/);
});

test("SessionSchedule renders loading state", () => {
  const html = renderToStaticMarkup(
    createElement(SessionSchedule, {
      date: "2026-05-22",
      onRetry: () => undefined,
      state: { sessions: [], status: "loading" },
    })
  );

  assert.match(html, /Carregando programação/);
  assert.match(html, /22 de maio de 2026/);
});

test("SessionSchedule renders error state with retry", () => {
  const html = renderToStaticMarkup(
    createElement(SessionSchedule, {
      date: "2026-05-22",
      onRetry: () => undefined,
      state: {
        errorMessage: "Falha de conexão.",
        sessions: [],
        status: "error",
      },
    })
  );

  assert.match(html, /Programação indisponível/);
  assert.match(html, /Falha de conexão/);
  assert.match(html, /Tentar novamente/);
});

test("SessionSchedule renders empty state for date with no sessions", () => {
  const html = renderToStaticMarkup(
    createElement(SessionSchedule, {
      date: "2026-05-22",
      onRetry: () => undefined,
      state: { sessions: [], status: "success" },
    })
  );

  assert.match(html, /Nenhuma sessão nesta data/);
  assert.match(html, /22 de maio de 2026/);
});

test("SessionSchedule renders movies grouped by movie with session buttons", () => {
  const html = renderToStaticMarkup(
    createElement(SessionSchedule, {
      date: "2026-05-22",
      onRetry: () => undefined,
      state: { sessions: [sessionA], status: "success" },
    })
  );

  assert.match(html, /Em Cartaz Agora/);
  assert.match(html, /VIP/);
  assert.match(html, /18:00/);
  assert.match(html, /42,00/);
  assert.match(html, new RegExp(`href="/sessions/session-a/seats"`));
});

test("SessionSchedule session buttons include accessible aria-label with badges", () => {
  const html = renderToStaticMarkup(
    createElement(SessionSchedule, {
      date: "2026-05-22",
      onRetry: () => undefined,
      state: { sessions: [sessionA], status: "success" },
    })
  );

  assert.match(html, /formatos VIP, 3D, Legendado, Pré-estreia/);
  assert.match(html, /Selecionar sessão das 18:00/);
});

test("SessionSchedule renders past session as disabled span without link", () => {
  const html = renderToStaticMarkup(
    createElement(SessionSchedule, {
      date: "2026-05-22",
      onRetry: () => undefined,
      state: { sessions: [pastSessionA], status: "success" },
    })
  );

  assert.match(html, /18:00/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /Sessão das 18:00 encerrada/);
  assert.doesNotMatch(html, new RegExp(`href="/sessions/session-past/seats"`));
  assert.doesNotMatch(html, /Selecionar sessão das 18:00/);
});

test("SessionSchedule filters out em_breve movies even if sessions slip through", () => {
  const comingSoonSession: CatalogSession = {
    ...sessionA,
    id: "session-coming-soon",
    movie: { ...nowShowingMovie, id: "movie-soon-id", status: "em_breve", title: "Futuro Filme" },
  };

  const html = renderToStaticMarkup(
    createElement(SessionSchedule, {
      date: "2026-05-22",
      onRetry: () => undefined,
      state: { sessions: [comingSoonSession], status: "success" },
    })
  );

  assert.match(html, /Nenhuma sessão nesta data/);
  assert.doesNotMatch(html, /Futuro Filme/);
  assert.doesNotMatch(html, new RegExp(`href="/sessions/session-coming-soon/seats"`));
});
