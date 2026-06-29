import { z } from 'zod'
import { SUPPORTED_LOCALES } from '../services/translation.service.js'

const sourceLanguageField = z
  .enum(SUPPORTED_LOCALES)
  .optional()
  .default('pt-BR')

export const createGenreSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50),
  source_language: sourceLanguageField,
})

export const updateGenreSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50).optional(),
  source_language: sourceLanguageField,
})
