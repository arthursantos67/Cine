/**
 * Script de migração: popula campo `translations` de todos os filmes usando TMDB.
 * Uso: node --env-file=.env src/migrate_translations.js
 */

import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Tenta carregar TMDB token dos arquivos .env do frontend como fallback
function loadFrontendEnvToken() {
  const candidates = [
    path.join(__dirname, '../../frontend/.env.local'),
    path.join(__dirname, '../../frontend/.env'),
  ]
  for (const envPath of candidates) {
    try {
      const content = fs.readFileSync(envPath, 'utf8')
      const match = content.match(/^TMDB_API_READ_TOKEN=(.+)$/m)
      if (match?.[1]?.trim()) return match[1].trim()
    } catch {
      // try next
    }
  }
  return null
}

const TMDB_BASE = 'https://api.themoviedb.org/3'
const LOCALES = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'zh-CN', 'ja-JP']

async function getTmdbToken(db) {
  // Prioridade: env var → .env.local do frontend → banco de dados
  if (process.env.TMDB_API_READ_TOKEN) return process.env.TMDB_API_READ_TOKEN
  const fromFrontend = loadFrontendEnvToken()
  if (fromFrontend) return fromFrontend
  const config = await db.collection('configs').findOne({ key: 'tmdb_token' })
  return config?.value ?? null
}

async function searchTmdb(title, token) {
  const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}&language=pt-BR`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.[0] ?? null
}

async function fetchMovieTranslations(tmdbId, token) {
  const translations = {}
  await Promise.allSettled(
    LOCALES.map(async (locale) => {
      try {
        const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?language=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.title || data.overview) {
          translations[locale] = { title: data.title ?? '', synopsis: data.overview ?? '' }
        }
      } catch {
        // ignore locale failure
      }
    })
  )
  return translations
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  console.log('Conectado ao MongoDB.')

  const token = await getTmdbToken(db)
  if (!token) {
    console.error('Token TMDB não encontrado na coleção configs. Configure-o no painel admin primeiro.')
    process.exit(1)
  }
  console.log('Token TMDB encontrado.')

  const movies = await db.collection('movies').find({}).toArray()
  console.log(`Encontrados ${movies.length} filmes. Iniciando migração...\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const movie of movies) {
    const hasTranslations = movie.translations && Object.keys(movie.translations).length > 0
    if (hasTranslations) {
      console.log(`  SKIP  "${movie.title}" — já tem traduções`)
      skipped++
      continue
    }

    process.stdout.write(`  Buscando "${movie.title}"... `)

    try {
      const result = await searchTmdb(movie.title, token)
      if (!result) {
        console.log('não encontrado no TMDB')
        failed++
        continue
      }

      const translations = await fetchMovieTranslations(result.id, token)
      const localesFound = Object.keys(translations)

      if (localesFound.length === 0) {
        console.log('sem traduções disponíveis')
        failed++
        continue
      }

      await db.collection('movies').updateOne(
        { _id: movie._id },
        { $set: { translations } }
      )

      console.log(`OK (${localesFound.join(', ')})`)
      updated++
    } catch (err) {
      console.log(`ERRO: ${err.message}`)
      failed++
    }

    // Respeitar rate limit do TMDB (40 reqs/10s)
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log(`\nMigração concluída:`)
  console.log(`  ✓ Atualizados: ${updated}`)
  console.log(`  - Pulados (já tinham traduções): ${skipped}`)
  console.log(`  ✗ Falhas: ${failed}`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
