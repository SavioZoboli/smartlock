import tipoEquipamentoController from "../controllers/tipoEquipamento.controller";
import { authMiddleware, handleAdmin } from "../middlewares/auth.middleware";

const router = require('express').Router();

router.get('/', authMiddleware, tipoEquipamentoController.listAll);
router.get('/:id', authMiddleware, tipoEquipamentoController.getById);

// CRUD administrativo
router.post('/', authMiddleware, handleAdmin, tipoEquipamentoController.create);
router.put('/', authMiddleware, handleAdmin, tipoEquipamentoController.update);
router.put('/:id', authMiddleware, handleAdmin, tipoEquipamentoController.update);
router.delete('/:id', authMiddleware, handleAdmin, tipoEquipamentoController.delete);


module.exports = router;
