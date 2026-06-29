import "server-only";

// BACKEND_INTERNAL_URL is a server-only var for server-to-server calls (e.g., Docker).
// Falls back to NEXT_PUBLIC_API_BASE_URL if not set.
const BACKEND_URL = (
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function getTmdbToken(): Promise<string | null> {
  // Database takes priority: token configured via admin UI overrides env var.
  // TMDB_API_READ_TOKEN is only a fallback when the database has no token.
  if (INTERNAL_API_KEY) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/internal/tmdb-token/`, {
        headers: { "X-Internal-Key": INTERNAL_API_KEY },
        next: { revalidate: 300, tags: ["tmdb-token"] },
      });
      if (res.ok) {
        const data = (await res.json()) as { value: string | null };
        if (data.value) return data.value;
      }
    } catch {
      // fall through to env var fallback
    }
  } else {
    console.warn("[getTmdbToken] INTERNAL_API_KEY não configurada — tentando TMDB_API_READ_TOKEN");
  }

  return process.env.TMDB_API_READ_TOKEN ?? null;
}
