import User from '../models/User.js'
import Review from '../models/Review.js'
import ReviewVote from '../models/ReviewVote.js'
import MovieInterest from '../models/MovieInterest.js'
import Config from '../models/Config.js'

const CLEANUP_FLAG_KEY = 'orphaned_content_cleanup_v1'

// Remove, uma única vez, Review/ReviewVote/MovieInterest que sobraram de
// contas excluídas antes do cascade delete existir (ver
// userService.deleteMe/deleteById). Controlado por uma flag em Config para
// não repetir a varredura completa a cada boot do servidor.
export async function cleanupOrphanedContent() {
  const alreadyRan = await Config.findOne({ key: CLEANUP_FLAG_KEY })
  if (alreadyRan) return { reviews: 0, votes: 0, interests: 0, skipped: true }

  const userIds = await User.distinct('_id')
  const userIdSet = new Set(userIds.map(String))

  const [reviews, votes, interests] = await Promise.all([
    Review.find({}, '_id user'),
    ReviewVote.find({}, '_id user review'),
    MovieInterest.find({}, '_id user'),
  ])

  const orphanReviewIds = reviews.filter((r) => !userIdSet.has(String(r.user))).map((r) => r._id)
  const orphanReviewIdSet = new Set(orphanReviewIds.map(String))
  const remainingReviewIds = new Set(reviews.filter((r) => !orphanReviewIdSet.has(String(r._id))).map((r) => String(r._id)))

  const orphanVoteIds = votes
    .filter((v) => !userIdSet.has(String(v.user)) || !remainingReviewIds.has(String(v.review)))
    .map((v) => v._id)

  const orphanInterestIds = interests.filter((i) => !userIdSet.has(String(i.user))).map((i) => i._id)

  await Promise.all([
    Review.deleteMany({ _id: { $in: orphanReviewIds } }),
    ReviewVote.deleteMany({ _id: { $in: orphanVoteIds } }),
    MovieInterest.deleteMany({ _id: { $in: orphanInterestIds } }),
  ])
  await Config.create({ key: CLEANUP_FLAG_KEY, value: new Date().toISOString() })

  return { reviews: orphanReviewIds.length, votes: orphanVoteIds.length, interests: orphanInterestIds.length, skipped: false }
}
