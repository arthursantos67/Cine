import { z } from 'zod'

export const updateMeSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email('Email inválido').optional(),
})

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'staff', 'master'], { required_error: 'Role obrigatório' }),
})
