import { genreRepository } from '../repositories/genre.repository.js'
import { AppError } from '../middlewares/error.middleware.js'
import { translateToAllLocales, DEFAULT_LOCALE } from './translation.service.js'

async function buildTranslations(name, sourceLocale = DEFAULT_LOCALE) {
  const flat = await translateToAllLocales(name, sourceLocale)
  return Object.fromEntries(
    Object.entries(flat).map(([locale, text]) => [locale, { name: text }])
  )
}

export const genreService = {
  async list() {
    return genreRepository.findAll()
  },

  async getById(id) {
    const genre = await genreRepository.findById(id)
    if (!genre) throw new AppError('Gênero não encontrado', 404)
    return genre
  },

  async create(data) {
    const { name, source_language = DEFAULT_LOCALE } = data
    const translations = await buildTranslations(name, source_language)
    return genreRepository.create({ name, translations })
  },

  async update(id, data) {
    const { name, source_language = DEFAULT_LOCALE } = data
    const updateData = {}
    if (name !== undefined) {
      updateData.name = name
      updateData.translations = await buildTranslations(name, source_language)
    }
    const genre = await genreRepository.updateById(id, updateData)
    if (!genre) throw new AppError('Gênero não encontrado', 404)
    return genre
  },

  async delete(id) {
    const genre = await genreRepository.deleteById(id)
    if (!genre) throw new AppError('Gênero não encontrado', 404)
  },
}
