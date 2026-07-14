import equipamentoController from "../controllers/equipamento.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = require('express').Router();

router.get('/comigo',authMiddleware,equipamentoController.equipamentosComigo)

router.post('/bulkCreate',authMiddleware,equipamentoController.bulkCreate)

router.get('/:id',authMiddleware,equipamentoController.getById)

router.get('/',authMiddleware,equipamentoController.listAll)


router.put('/',authMiddleware,equipamentoController.update)

router.put('/redirect',authMiddleware,equipamentoController.redirect)

router.delete('/:id',authMiddleware,equipamentoController.deactivate)

router.get('/listBySmartlock/:smartlock_id',authMiddleware,equipamentoController.listBySmartlock)

router.get('/relatorio/disponibilidade/:smartlock_id',authMiddleware,equipamentoController.reportDisponibilidade)







module.exports = router;