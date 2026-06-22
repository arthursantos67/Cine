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
  if (process.env.TMDB_API_READ_TOKEN) {
    return process.env.TMDB_API_READ_TOKEN;
  }

  if (!INTERNAL_API_KEY) {
    console.warn("[getTmdbToken] INTERNAL_API_KEY não configurada — TMDB indisponível");
    return null;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/internal/tmdb-token/`, {
      headers: { "X-Internal-Key": INTERNAL_API_KEY },
      // Next.js data cache: revalidate every 5 min. Works correctly across
      // serverless invocations and multi-worker deployments unlike module-level vars.
      next: { revalidate: 300, tags: ["tmdb-token"] },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { value: string | null };
    return data.value ?? null;
  } catch {
    return null;
  }
}
