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

// TODO: débito técnico - usando POST em vez de QUERY (RFC 10008)
// Motivo: suporte instável em proxies/firewalls corporativos (Palo Alto bloqueando/resetando)
// Retomar quando: 
//   - confirmar liberação de método QUERY na política do firewall, OU
//   - navegadores/fetch API suportarem QUERY nativamente com CORS tratado
// Rota afetada: POST /smartlocks/:id/equipamentos/disponiveis (deveria ser QUERY)
router.post('/disponiveis-para-reserva',authMiddleware,equipamentoController.listDisponiveisParaReserva)





module.exports = router;