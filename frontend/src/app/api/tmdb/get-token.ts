// BACKEND_INTERNAL_URL is a server-only var for server-to-server calls (e.g., Docker).
// Falls back to NEXT_PUBLIC_API_BASE_URL if not set.
const BACKEND_URL = (
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

let cachedToken: string | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getTmdbToken(): Promise<string | null> {
  if (process.env.TMDB_API_READ_TOKEN) {
    return process.env.TMDB_API_READ_TOKEN;
  }

  if (!INTERNAL_API_KEY) return null;

  const now = Date.now();
  if (cachedToken !== null && now < cacheExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/internal/tmdb-token/`, {
      headers: { "X-Internal-Key": INTERNAL_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { value: string | null };
    cachedToken = data.value ?? null;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return cachedToken;
  } catch {
    return null;
  }
}
