import { z } from 'zod'

const sessionBase = z.object({
  movie: z.string().min(1, 'Filme obrigatório'),
  room: z.string().min(1, 'Sala obrigatória'),
  startTime: z.string().datetime({ message: 'startTime inválido' }),
  endTime: z.string().datetime({ message: 'endTime inválido' }),
  basePrice: z.number().min(0.01, 'Preço mínimo é R$0,01'),
  audioFormat: z.enum(['original', 'legendado', 'dublado']).optional(),
  projectionFormat: z.enum(['2d', '3d', 'imax']).optional(),
  sessionType: z.enum(['regular', 'preview', 'special_event']).optional(),
})

export const createSessionSchema = sessionBase.extend({
  repeatDays: z.number().int().min(0).max(30).optional(),
})

export const updateSessionSchema = sessionBase.partial()
