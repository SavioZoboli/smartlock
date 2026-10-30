import equipamentoCredencialController from "../controllers/equipamentoCredencial.controller";
import { authMiddleware, handleAdmin } from "../middlewares/auth.middleware";

const router = require('express').Router();

// Listagem: dados gerais + login. NUNCA retorna a senha.
router.get('/', authMiddleware, equipamentoCredencialController.listAll)
router.get('/equipamento/:equipamento_id', authMiddleware, equipamentoCredencialController.getByEquipamento)

// "Ver Senha": descriptografa + grava auditoria (LogAcessoEqpCred).
// POST porque a operação tem efeito colateral (insere log) e não deve ser cacheada.
router.post('/equipamento/:equipamento_id/revelar', authMiddleware, equipamentoCredencialController.revelarSenha)

// CRUD administrativo
router.post('/', authMiddleware, handleAdmin, equipamentoCredencialController.create)
router.put('/equipamento/:equipamento_id', authMiddleware, handleAdmin, equipamentoCredencialController.update)
router.delete('/equipamento/:equipamento_id', authMiddleware, handleAdmin, equipamentoCredencialController.delete)

module.exports = router;

