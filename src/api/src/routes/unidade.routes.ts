import unidadeController from "../controllers/unidade.controller"
import { authMiddleware, handleAdmin } from "../middlewares/auth.middleware"

const router = require('express').Router()


router.post('/',authMiddleware,handleAdmin,unidadeController.create)

router.get('/',authMiddleware,unidadeController.listAll)

router.get('/:id',authMiddleware,unidadeController.getById)

router.put('/',authMiddleware,handleAdmin,unidadeController.update)

router.delete('/:id',authMiddleware,handleAdmin,unidadeController.delete)


module.exports = router