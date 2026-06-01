import assert from "node:assert/strict";
import test from "node:test";

import { adminApi } from "./admin";

const movieDetail = {
  age_rating: "12",
  cast: ["Actor One", "Actor Two"],
  created_at: "2026-05-20T10:00:00-03:00",
  director: "Director Name",
  duration_minutes: 120,
  genres: [{ id: "genre-1", name: "Ação" }],
  id: "movie-1",
  is_featured: true,
  poster_url: "https://cdn.example.com/poster.jpg",
  release_date: "2026-06-01",
  status: "em_cartaz",
  synopsis: "Uma sinopse.",
  title: "Filme Teste",
  updated_at: "2026-05-21T10:00:00-03:00",
};

const paginatedMovies = {
  count: 1,
  next: null,
  previous: null,
  results: [movieDetail],
};

const genre = {
  created_at: "2026-05-20T10:00:00-03:00",
  id: "genre-1",
  name: "Ação",
  updated_at: "2026-05-21T10:00:00-03:00",
};

const paginatedGenres = {
  count: 1,
  next: null,
  previous: null,
  results: [genre],
};

test("adminApi.listMovies fetches the paginated movie list", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/movies/");
      assert.equal(init?.method, "GET");

      return Response.json(paginatedMovies);
    };

    const response = await adminApi.listMovies();

    assert.equal(response.count, 1);
    assert.equal(response.results[0].title, "Filme Teste");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.listMovies builds status and search filters", async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  try {
    globalThis.fetch = async (input) => {
      requestedUrls.push(String(input));
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    };

    await adminApi.listMovies({ status: "em_cartaz" });
    await adminApi.listMovies({ search: "Blade" });
    await adminApi.listMovies({ status: "pre_venda", search: "Runner", page: 2 });

    assert.deepEqual(requestedUrls, [
      "http://localhost:8000/api/v1/catalog/movies/?status=em_cartaz",
      "http://localhost:8000/api/v1/catalog/movies/?search=Blade",
      "http://localhost:8000/api/v1/catalog/movies/?status=pre_venda&search=Runner&page=2",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.getMovie fetches a single movie by id", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/movies/movie-1/");
      return Response.json(movieDetail);
    };

    const movie = await adminApi.getMovie("movie-1");

    assert.equal(movie.id, "movie-1");
    assert.equal(movie.title, "Filme Teste");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.createMovie posts the movie payload", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/movies/");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.title, "Filme Teste");
      assert.deepEqual(body.genres, ["genre-1"]);
      assert.deepEqual(body.cast, ["Actor One"]);
      return Response.json(movieDetail);
    };

    await adminApi.createMovie({
      cast: ["Actor One"],
      duration_minutes: 120,
      genres: ["genre-1"],
      is_featured: true,
      poster_url: "https://cdn.example.com/poster.jpg",
      release_date: "2026-06-01",
      status: "em_cartaz",
      synopsis: "Uma sinopse.",
      title: "Filme Teste",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.updateMovie patches the movie by id", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/movies/movie-1/");
      assert.equal(init?.method, "PATCH");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.is_featured, false);
      return Response.json({ ...movieDetail, is_featured: false });
    };

    const updated = await adminApi.updateMovie("movie-1", { is_featured: false });
    assert.equal(updated.is_featured, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.deleteMovie sends a DELETE request", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/movies/movie-1/");
      assert.equal(init?.method, "DELETE");
      return new Response(null, { status: 204 });
    };

    await adminApi.deleteMovie("movie-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.listGenres fetches the paginated genre list with auth", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/genres/");
      assert.equal(init?.method, "GET");
      return Response.json(paginatedGenres);
    };

    const response = await adminApi.listGenres();

    assert.equal(response.count, 1);
    assert.equal(response.results[0].name, "Ação");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.listGenres builds page param", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/genres/?page=2");
      return Response.json(paginatedGenres);
    };

    await adminApi.listGenres({ page: 2 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.createGenre posts the genre payload", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/genres/");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.name, "Ação");
      return Response.json(genre);
    };

    const created = await adminApi.createGenre({ name: "Ação" });
    assert.equal(created.id, "genre-1");
    assert.equal(created.name, "Ação");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.updateGenre patches the genre by id", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/genres/genre-1/");
      assert.equal(init?.method, "PATCH");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.name, "Drama");
      return Response.json({ ...genre, name: "Drama" });
    };

    const updated = await adminApi.updateGenre("genre-1", { name: "Drama" });
    assert.equal(updated.name, "Drama");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.deleteGenre sends a DELETE request", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/genres/genre-1/");
      assert.equal(init?.method, "DELETE");
      return new Response(null, { status: 204 });
    };

    await adminApi.deleteGenre("genre-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.getMovie rejects unexpected response shape", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => Response.json({ id: "movie-1" });

    await assert.rejects(
      adminApi.getMovie("movie-1"),
      /Unexpected admin movie detail response/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.listMovies rejects non-paginated response", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => Response.json([]);

    await assert.rejects(
      adminApi.listMovies(),
      /Unexpected admin movie list response/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.createGenre rejects unexpected response shape", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => Response.json({});

    await assert.rejects(
      adminApi.createGenre({ name: "Ação" }),
      /Unexpected admin create genre response/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
