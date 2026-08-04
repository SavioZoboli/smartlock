import regiaoController from "../controllers/regiao.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = require("express").Router()


router.get('/',authMiddleware,regiaoController.listAll)


module.exports = router