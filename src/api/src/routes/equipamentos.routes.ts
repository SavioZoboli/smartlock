import equipamentoController from "../controllers/equipamento.controller";
import { authMiddleware, handleAdmin } from "../middlewares/auth.middleware";

const router = require('express').Router();

router.get('/comigo',authMiddleware,equipamentoController.equipamentosComigo)

router.post('/bulkCreate',authMiddleware,handleAdmin,equipamentoController.bulkCreate)

router.get('/:id',authMiddleware,equipamentoController.getById)

router.get('/',authMiddleware,equipamentoController.listAll)


router.put('/',authMiddleware,handleAdmin,equipamentoController.update)

router.put('/redirect',authMiddleware,handleAdmin,equipamentoController.redirect)

router.delete('/:id',authMiddleware,handleAdmin,equipamentoController.deactivate)

router.get('/listBySmartlock/:smartlock_id',authMiddleware,equipamentoController.listBySmartlock)

router.get('/relatorio/disponibilidade/:smartlock_id',authMiddleware,equipamentoController.reportDisponibilidade)







module.exports = router;