import reservaController from "../controllers/reserva.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = require("express").Router()

router.post('/',authMiddleware,reservaController.create)

module.exports = router