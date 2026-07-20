import authController from "../controllers/auth.controller"
import { authMiddleware } from "../middlewares/auth.middleware";

const router = require('express').Router()

router.post('/',authController.handleGoogleAuth)

router.get('/me',authMiddleware,authController.returnMe)

router.post('/logout',authController.logout)

router.get('/googleToken',authController.returnToken)

module.exports = router