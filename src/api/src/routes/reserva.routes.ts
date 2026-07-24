import reservaController from "../controllers/reserva.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = require("express").Router()

router.post('/',authMiddleware,reservaController.create)

router.get('/',authMiddleware,reservaController.reservasDoUsuario)

router.get('/:id',authMiddleware,reservaController.getById)

router.put('/',authMiddleware,reservaController.update)

router.delete('/:id',authMiddleware,reservaController.delete)

module.exports = router