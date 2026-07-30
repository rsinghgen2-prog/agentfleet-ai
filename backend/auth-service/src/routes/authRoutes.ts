import { Router } from 'express'
import authController from '../controllers/authController'

const router = Router()

router.post('/login', (req, res, next) => authController.login(req, res, next))
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next))
router.post('/logout', (req, res) => authController.logout(req, res))

export default router