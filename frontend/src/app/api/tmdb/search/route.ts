import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const token = process.env.TMDB_API_READ_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TMDB not configured" }, { status: 500 });
  }

  const locale = request.nextUrl.searchParams.get("locale") ?? "pt-BR";
  const tmdbLanguage = locale.startsWith("pt") ? "pt-BR" : locale;
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=${encodeURIComponent(tmdbLanguage)}&page=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "TMDB search failed" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    results: (data.results ?? []).slice(0, 8).map((movie: {
      id: number;
      title: string;
      original_title: string;
      release_date?: string;
      poster_path?: string;
    }) => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      year: movie.release_date?.slice(0, 4) ?? null,
      poster_path: movie.poster_path ?? null,
    })),
  });
}
