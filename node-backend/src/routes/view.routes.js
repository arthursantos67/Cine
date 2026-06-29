import { Router } from 'express'
import { viewController } from '../controllers/view.controller.js'

const router = Router()

router.get('/movies', viewController.listMovies)
router.get('/movies/:id', viewController.movieDetail)

export default router
