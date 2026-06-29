import { z } from 'zod'

const movieBase = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  synopsis: z.string().min(1, 'Sinopse obrigatória'),
  genres: z.array(z.string()).optional(),
  durationMin: z.number().int().min(1, 'Duração mínima é 1 minuto'),
  releaseDate: z.string().datetime({ message: 'Data de lançamento inválida' }),
  posterUrl: z.string().url('URL do poster inválida'),
  status: z.enum(['em_cartaz', 'pre_venda', 'em_breve']).optional(),
  ageRating: z.enum(['L', '10', '12', '14', '16', '18']).optional(),
  director: z.string().optional(),
  isFeatured: z.boolean().optional(),
})

export const createMovieSchema = movieBase
export const updateMovieSchema = movieBase.partial()
