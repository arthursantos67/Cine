import { userService } from '../services/user.service.js'
import { toUserDTO } from '../dtos/user.dto.js'
import { paginate } from '../utils/pagination.js'
import User from '../models/User.js'
import Ticket from '../models/Ticket.js'
import Config from '../models/Config.js'
import AdminLog from '../models/AdminLog.js'
import { AppError } from '../middlewares/error.middleware.js'

export const userController = {
  async getMe(req, res, next) {
    try {
      const user = await userService.getMe(req.user._id)
      res.json(toUserDTO(user))
    } catch (err) {
      next(err)
    }
  },

  async updateMe(req, res, next) {
    try {
      const user = await userService.updateMe(req.user._id, req.validatedBody)
      res.json(toUserDTO(user))
    } catch (err) {
      next(err)
    }
  },

  async deleteMe(req, res, next) {
    try {
      await userService.deleteMe(req.user._id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },

  async listAll(req, res, next) {
    try {
      const filter = {}
      if (req.query.role) filter.role = req.query.role
      if (req.query.search) {
        filter.$or = [
          { email: { $regex: req.query.search, $options: 'i' } },
          { username: { $regex: req.query.search, $options: 'i' } },
        ]
      }
      const result = await paginate(User.find(filter).sort('-createdAt'), req.query, req)
      res.json({ ...result, results: result.results.map(toUserDTO) })
    } catch (err) {
      next(err)
    }
  },

  async grantAdmin(req, res, next) {
    try {
      const { role } = req.body
      if (!['staff', 'master'].includes(role)) {
        throw new AppError('Role inválido', 400)
      }
      const user = await userService.updateRole(req.user._id, req.params.id, role)
      res.json(toUserDTO(user))
    } catch (err) {
      next(err)
    }
  },

  async revokeAdmin(req, res, next) {
    try {
      const user = await userService.updateRole(req.user._id, req.params.id, 'user')
      res.json(toUserDTO(user))
    } catch (err) {
      next(err)
    }
  },

  async getAdminLogs(req, res, next) {
    try {
      const userId = req.params.id
      const logs = await AdminLog.find({
        $or: [{ targetId: userId }, { actorId: userId }],
      })
        .sort('-createdAt')
        .limit(100)
        .lean()

      res.json(
        logs.map((log) => ({
          actor: log.actorUsername,
          target: log.targetUsername,
          action: log.action,
          role: log.role ?? null,
          created_at: log.createdAt.toISOString(),
        }))
      )
    } catch (err) {
      next(err)
    }
  },

  async deleteById(req, res, next) {
    try {
      await userService.deleteById(req.user._id, req.params.id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },

  async transferPrimaryMaster(req, res, next) {
    try {
      const user = await userService.transferPrimaryMaster(req.user._id, req.params.id)
      res.json(toUserDTO(user))
    } catch (err) {
      next(err)
    }
  },

  async listMyTickets(req, res, next) {
    try {
      const filter = { user: req.user._id }
      if (req.query.type) filter.ticket_type = req.query.type
      const result = await paginate(
        Ticket.find(filter)
          .populate({
            path: 'session_seat',
            populate: [
              {
                path: 'session',
                populate: [
                  { path: 'movie', select: 'title poster_url posterUrl' },
                  { path: 'room', select: 'name' },
                ],
              },
              {
                path: 'seat',
                populate: { path: 'row', model: 'SeatRow' },
              },
            ],
          })
          .sort('-createdAt'),
        req.query,
        req
      )
      res.json({ ...result, results: result.results.map(toTicketDTO) })
    } catch (err) {
      next(err)
    }
  },

  async getTmdbTokenStatus(req, res, next) {
    try {
      const config = await Config.findOne({ key: 'tmdb_token' })
      const value = config?.value ?? null
      const configured = !!value
      const hint = configured ? value.slice(-4) : null
      res.json({ configured, hint })
    } catch (err) {
      next(err)
    }
  },

  async setTmdbToken(req, res, next) {
    try {
      const { value } = req.body
      if (typeof value !== 'string' || !value.trim()) {
        throw new AppError('Token inválido', 422)
      }
      await Config.findOneAndUpdate(
        { key: 'tmdb_token' },
        { value: value.trim() },
        { upsert: true, new: true }
      )
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
}

function toTicketDTO(t) {
  const ss = t.session_seat
  const session = ss?.session
  const seat = ss?.seat
  const row = seat?.row
  return {
    ticket_id: String(t._id),
    ticket_code: t.ticket_code,
    ticket_type: t.ticket_type,
    amount_paid: Number(t.amount_paid).toFixed(2),
    payment_method: t.payment_method,
    created_at: t.createdAt?.toISOString?.() ?? t.createdAt,
    movie: {
      id: String(session?.movie?._id ?? ''),
      title: session?.movie?.title ?? '',
      poster_url: session?.movie?.posterUrl ?? session?.movie?.poster_url ?? null,
    },
    session: {
      id: String(session?._id ?? ''),
      start_time: session?.startTime?.toISOString?.() ?? session?.startTime ?? '',
      end_time: session?.endTime?.toISOString?.() ?? session?.endTime ?? '',
    },
    room: {
      id: String(session?.room?._id ?? ''),
      name: session?.room?.name ?? '',
    },
    seat: {
      id: String(seat?._id ?? ''),
      row: row?.name ?? '',
      number: seat?.number ?? 0,
      identifier: `${row?.name ?? ''}${seat?.number ?? ''}`,
    },
  }
}
