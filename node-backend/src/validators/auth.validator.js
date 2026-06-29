import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres').max(30),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

// Aceita tanto { refresh } (frontend Django) quanto { refreshToken } (legado)
export const refreshSchema = z.object({
  refresh: z.string().optional(),
  refreshToken: z.string().optional(),
}).refine((d) => d.refresh || d.refreshToken, { message: 'Refresh token obrigatório' })
