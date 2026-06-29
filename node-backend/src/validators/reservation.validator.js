import { z } from 'zod'

export const createReservationSchema = z.object({
  session: z.string().min(1, 'Sessão obrigatória'),
  seatLabel: z.string().min(1, 'Assento obrigatório').toUpperCase(),
  ticketType: z.enum(['inteira', 'meia', 'gratuito']).optional(),
})

export const checkoutSchema = z.object({
  reservationId: z.string().min(1, 'ID da reserva obrigatório'),
  paymentMethod: z.enum(['cartao_credito', 'pix'], { required_error: 'Método de pagamento obrigatório' }),
})
