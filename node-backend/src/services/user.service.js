import { userRepository } from '../repositories/user.repository.js'
import { AppError } from '../middlewares/error.middleware.js'
import AdminLog from '../models/AdminLog.js'
import Review from '../models/Review.js'
import ReviewVote from '../models/ReviewVote.js'
import MovieInterest from '../models/MovieInterest.js'

// Remove todo conteúdo gerado pelo usuário para não deixar referências
// órfãs (ex: avaliações cujo autor foi excluído quebravam a listagem).
async function deleteUserContent(userId) {
  const ownReviews = await Review.find({ user: userId }, '_id')
  const ownReviewIds = ownReviews.map((r) => r._id)

  await Promise.all([
    Review.deleteMany({ user: userId }),
    ReviewVote.deleteMany({ user: userId }),
    ReviewVote.deleteMany({ review: { $in: ownReviewIds } }),
    MovieInterest.deleteMany({ user: userId }),
  ])
}

export const userService = {
  async getMe(id) {
    const user = await userRepository.findById(id)
    if (!user) throw new AppError('Usuário não encontrado', 404)
    return user
  },

  async updateMe(id, data) {
    if (data.email) {
      const exists = await userRepository.existsByEmail(data.email)
      if (exists) throw new AppError('Email já cadastrado', 409)
    }
    const user = await userRepository.updateById(id, data)
    if (!user) throw new AppError('Usuário não encontrado', 404)
    return user
  },

  async deleteMe(id) {
    const user = await userRepository.findById(id)
    if (!user) throw new AppError('Usuário não encontrado', 404)
    if (user.isPrimaryMaster) {
      throw new AppError(
        'O master principal não pode excluir a própria conta. Transfira o status de master principal para outro usuário antes.',
        403
      )
    }
    await deleteUserContent(id)
    await userRepository.deleteById(id)
  },

  async listAll() {
    return userRepository.findAll()
  },

  async updateRole(requesterId, targetId, role) {
    const requester = await userRepository.findById(requesterId)
    const target = await userRepository.findById(targetId)
    if (!target) throw new AppError('Usuário não encontrado', 404)

    if (target.isPrimaryMaster) {
      throw new AppError('O role do master principal não pode ser alterado', 403)
    }

    // Apenas master principal pode promover/rebaixar outro master
    if ((target.role === 'master' || role === 'master') && !requester.isPrimaryMaster) {
      throw new AppError('Apenas o master principal pode alterar o role de outro master', 403)
    }

    const user = await userRepository.updateById(targetId, { role })
    if (!user) throw new AppError('Usuário não encontrado', 404)

    const action = role === 'user' ? 'revoked' : 'granted'
    const logRole = role === 'user' ? target.role : role
    await AdminLog.create({
      actorId: requester._id,
      actorUsername: requester.username,
      targetId: String(target._id),
      targetUsername: target.username,
      action,
      role: logRole,
    })

    return user
  },

  async deleteById(requesterId, targetId) {
    if (String(requesterId) === String(targetId)) {
      throw new AppError('Use DELETE /users/me para excluir a própria conta', 400)
    }

    const requester = await userRepository.findById(requesterId)
    const target = await userRepository.findById(targetId)
    if (!target) throw new AppError('Usuário não encontrado', 404)

    if (target.isPrimaryMaster) {
      throw new AppError(
        'O master principal não pode ser excluído. Ele deve transferir o status antes.',
        403
      )
    }

    // Apenas master principal pode excluir outros masters
    if (target.role === 'master' && !requester.isPrimaryMaster) {
      throw new AppError('Apenas o master principal pode excluir outro master', 403)
    }

    await AdminLog.create({
      actorId: requester._id,
      actorUsername: requester.username,
      targetId: String(target._id),
      targetUsername: target.username,
      action: 'deleted',
      role: null,
    })

    await deleteUserContent(targetId)
    await userRepository.deleteById(targetId)
  },

  async transferPrimaryMaster(fromId, toId) {
    if (String(fromId) === String(toId)) {
      throw new AppError('Você já é o master principal', 400)
    }

    const from = await userRepository.findById(fromId)
    if (!from || !from.isPrimaryMaster) {
      throw new AppError('Apenas o master principal pode realizar esta transferência', 403)
    }

    const to = await userRepository.findById(toId)
    if (!to) throw new AppError('Usuário de destino não encontrado', 404)

    // Promove o destino a master principal
    await userRepository.updateById(toId, { role: 'master', isPrimaryMaster: true })
    // Remove o status do remetente (permanece master comum)
    await userRepository.updateById(fromId, { isPrimaryMaster: false })

    return userRepository.findById(toId)
  },
}
