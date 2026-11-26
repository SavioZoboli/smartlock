import { z } from "zod";
import authController from "../controllers/auth.controller"
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";

const router = require('express').Router()

const googleAuthSchema = z.object({
  token: z.string().min(1, "Token não fornecido."),
});

router.post('/', validateBody(googleAuthSchema), authController.handleGoogleAuth)

router.get('/me',authMiddleware,authController.returnMe)

router.post('/logout',authController.logout)

router.post('/refresh',authController.refresh)

router.get('/googleToken',authController.returnToken)

module.exports = router