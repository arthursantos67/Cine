import { z } from 'zod'

const roomBase = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  capacity: z.number().int().min(1, 'Capacidade mínima é 1'),
  experienceType: z.enum(['standard', 'vip', 'premium', 'imax']).optional(),
  basePrice: z.number().min(0.01, 'Preço mínimo é R$0,01'),
})

export const createRoomSchema = roomBase
export const updateRoomSchema = roomBase.partial()
