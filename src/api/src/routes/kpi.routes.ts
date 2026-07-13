import kpiController from "../controllers/kpi.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = require("express").Router();

router.get("/equipamentos-comigo",authMiddleware, kpiController.equipamentosComigo);
router.get("/proxima-reserva",authMiddleware, kpiController.proximaReserva);
router.get("/emprestimos-mes",authMiddleware, kpiController.emprestimosPorMes);
router.get("/equipamentos-manutencao",authMiddleware, kpiController.equipamentosEmManutencao);
router.get("/taxa-disponibilidade",authMiddleware, kpiController.taxaDisponibilidade);
router.get("/equipamento-mais-usado",authMiddleware, kpiController.equipamentoMaisUsado);
router.get("/tempo-medio-emprestimo",authMiddleware, kpiController.tempoMedioEmprestimo);
router.get("/reservas-pendentes",authMiddleware, kpiController.reservasPendentes);
router.get("/ultima-devolucao",authMiddleware, kpiController.ultimaDevolucao);
module.exports = router;
