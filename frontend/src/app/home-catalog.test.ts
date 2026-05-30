import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { CatalogMovie } from "@/types/catalog";

import { HomeCatalogSections, type MovieSectionState } from "./HomeCatalog";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const featuredMovie: CatalogMovie = {
  duration_minutes: 120,
  genres: [{ id: "genre-1", name: "Aventura" }],
  id: "featured-1",
  is_featured: true,
  poster_url: "https://cdn.example.com/featured.jpg",
  status: "em_cartaz",
  title: "A Jornada",
};

const preSaleMovie: CatalogMovie = {
  ...featuredMovie,
  id: "pre-sale-1",
  is_featured: false,
  status: "pre_venda",
  title: "Estreia da Semana",
};

const upcomingMovie: CatalogMovie = {
  ...featuredMovie,
  id: "upcoming-1",
  is_featured: false,
  status: "em_breve",
  title: "Em Breve na Tela",
};

const success = (movies: CatalogMovie[]): MovieSectionState => ({
  movies,
  status: "success",
});

test("home catalog renders featured banner, tabbed catalog, and upcoming section", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([featuredMovie]),
      nowShowing: success([featuredMovie]),
      preSale: success([preSaleMovie]),
      upcoming: success([upcomingMovie]),
    })
  );

  assert.match(html, /Filme em destaque: A Jornada/);
  assert.match(html, /href="\/movies\/featured-1"/);
  assert.match(html, /Em cartaz/);
  assert.match(html, /Pré-venda/);
  assert.match(html, /Estreia da Semana/);
  assert.match(html, /Em breve/);
  assert.match(html, /Em Breve na Tela/);
  assert.doesNotMatch(html, /age_rating|room_type|audio_format/i);
});

test("home catalog renders controls for multiple featured movies", () => {
  const secondFeaturedMovie: CatalogMovie = {
    ...featuredMovie,
    id: "featured-2",
    title: "Outra Jornada",
  };

  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([featuredMovie, secondFeaturedMovie]),
      nowShowing: success([]),
      preSale: success([]),
      upcoming: success([]),
    })
  );

  assert.match(html, /Filme em destaque: A Jornada/);
  assert.match(html, /Filme em destaque: Outra Jornada/);
  assert.match(html, /Mostrar destaque anterior/);
  assert.match(html, /Mostrar próximo destaque/);
  assert.match(html, /href="\/movies\/featured-2"/);
});

test("home catalog renders pt-BR loading and empty states", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: { movies: [], status: "loading" },
      nowShowing: success([]),
      preSale: success([]),
      upcoming: success([]),
    })
  );

  assert.match(html, /Carregando filme em destaque/);
  assert.match(html, /Nenhum filme em cartaz/);
  assert.match(html, /Ainda não há filmes em pré-venda no catálogo./);
  assert.match(html, /Nenhum filme em breve/);
});

test("home catalog renders retry-oriented error states", () => {
  const errorState: MovieSectionState = {
    errorMessage: "Não conseguimos carregar esta seção agora.",
    movies: [],
    status: "error",
  };

  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: errorState,
      nowShowing: errorState,
      onRetryFeatured: () => undefined,
      onRetryNowShowing: () => undefined,
      onRetryPreSale: () => undefined,
      onRetryUpcoming: () => undefined,
      preSale: errorState,
      upcoming: errorState,
    })
  );

  assert.match(html, /Destaque indisponível/);
  assert.match(html, /Em cartaz indisponível/);
  assert.match(html, /Pré-venda indisponível/);
  assert.match(html, /Em breve indisponível/);
  assert.match(html, /Tentar novamente/);
});

test("home catalog keeps successful sections visible when another section errors", () => {
  const errorState: MovieSectionState = {
    errorMessage: "Falha localizada.",
    movies: [],
    status: "error",
  };

  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([featuredMovie]),
      nowShowing: errorState,
      preSale: success([preSaleMovie]),
      upcoming: success([upcomingMovie]),
    })
  );

  assert.match(html, /Em cartaz indisponível/);
  assert.match(html, /Estreia da Semana/);
  assert.match(html, /Em Breve na Tela/);
});

test("tabbed catalog renders both tab buttons with correct ARIA attributes", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success([featuredMovie]),
      preSale: success([preSaleMovie]),
      upcoming: success([]),
    })
  );

  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /aria-selected="false"/);
});

test("tabbed catalog default tab is Em cartaz (aria-selected=true on first tab)", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success([featuredMovie]),
      preSale: success([preSaleMovie]),
      upcoming: success([]),
    })
  );

  // First tab (Em cartaz) is selected, second (Pré-venda) is not
  assert.ok(html.includes('aria-selected="true"'));
  assert.ok(html.includes('aria-selected="false"'));

  // Pre-sale panel is present but hidden
  assert.match(html, /hidden/);
  assert.match(html, /Estreia da Semana/);
});

test("tabbed catalog shows independent loading state for now showing", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: { movies: [], status: "loading" },
      preSale: success([preSaleMovie]),
      upcoming: success([]),
    })
  );

  assert.match(html, /Carregando filmes em cartaz/);
  assert.match(html, /Estreia da Semana/);
});

test("tabbed catalog shows independent loading state for pre-sale", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success([featuredMovie]),
      preSale: { movies: [], status: "loading" },
      upcoming: success([]),
    })
  );

  assert.match(html, /A Jornada/);
  assert.match(html, /Carregando filmes em pré-venda/);
});

test("tabbed catalog error state for now showing does not affect pre-sale", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: { errorMessage: "Falha em cartaz.", movies: [], status: "error" },
      onRetryNowShowing: () => undefined,
      preSale: success([preSaleMovie]),
      upcoming: success([]),
    })
  );

  assert.match(html, /Em cartaz indisponível/);
  assert.match(html, /Estreia da Semana/);
});

test("tabbed catalog error state for pre-sale does not affect now showing", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success([featuredMovie]),
      onRetryPreSale: () => undefined,
      preSale: { errorMessage: "Falha pré-venda.", movies: [], status: "error" },
      upcoming: success([]),
    })
  );

  assert.match(html, /A Jornada/);
  assert.match(html, /Pré-venda indisponível/);
});

test("tabbed catalog renders carousel navigation buttons when movies exist", () => {
  const manyMovies = Array.from({ length: 8 }, (_, i) => ({
    ...featuredMovie,
    id: `movie-${i}`,
    title: `Filme ${i + 1}`,
  }));

  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success(manyMovies),
      preSale: success([]),
      upcoming: success([]),
    })
  );

  assert.match(html, /Filme anterior em Em cartaz/);
  assert.match(html, /Próximo filme em Em cartaz/);
});

test("movie card renders pre-sale badge for pre_venda movies", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success([preSaleMovie]),
      preSale: success([]),
      upcoming: success([]),
    })
  );

  assert.match(html, /Pré-venda/);
});

test("movie card renders destaque badge for featured movies", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success([featuredMovie]),
      preSale: success([]),
      upcoming: success([]),
    })
  );

  assert.match(html, /Destaque/);
});

test("home catalog shows cinema indicator in tabbed catalog", () => {
  const html = renderToStaticMarkup(
    createElement(HomeCatalogSections, {
      featured: success([]),
      nowShowing: success([]),
      preSale: success([]),
      upcoming: success([]),
    })
  );

  assert.match(html, /CinePrime Natal/);
});
