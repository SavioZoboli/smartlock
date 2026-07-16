import movimentacaoController from "../controllers/movimentacao.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = require('express').Router()

router.post('/',authMiddleware,movimentacaoController.bulkMovimenta)

router.get('/ultimosDias/:dias',authMiddleware,movimentacaoController.getMovimentacoesUltimosDiasUsuario)

module.exports = router