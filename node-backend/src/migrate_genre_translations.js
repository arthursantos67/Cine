/**
 * Migração: popula campo `translations` de todos os gêneros sem tradução.
 * Uso: node --env-file=.env src/migrate_genre_translations.js
 */

import mongoose from 'mongoose'
import Genre from './models/Genre.js'
import { translateToAllLocales } from './services/translation.service.js'

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Conectado ao MongoDB.')

  const genres = await Genre.find({})
  console.log(`Encontrados ${genres.length} gêneros.\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const genre of genres) {
    const hasTranslations =
      genre.translations && Object.keys(genre.translations).length > 0

    if (hasTranslations) {
      console.log(`  SKIP  "${genre.name}" — já tem traduções`)
      skipped++
      continue
    }

    process.stdout.write(`  Traduzindo "${genre.name}"... `)

    try {
      const flat = await translateToAllLocales(genre.name, 'pt-BR')
      const translations = Object.fromEntries(
        Object.entries(flat).map(([locale, text]) => [locale, { name: text }])
      )

      await Genre.updateOne({ _id: genre._id }, { $set: { translations } })

      const localesFound = Object.keys(translations)
      console.log(`OK (${localesFound.join(', ')})`)
      updated++
    } catch (err) {
      console.log(`ERRO: ${err.message}`)
      failed++
    }

    // Respeitar rate limit da API de tradução
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log(`\nMigração de gêneros concluída:`)
  console.log(`  ✓ Atualizados: ${updated}`)
  console.log(`  - Pulados (já tinham traduções): ${skipped}`)
  console.log(`  ✗ Falhas: ${failed}`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
