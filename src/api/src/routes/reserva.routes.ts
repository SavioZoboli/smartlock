import { z } from "zod";
import reservaController from "../controllers/reserva.controller"
import { authMiddleware } from "../middlewares/auth.middleware"
import { validateBody } from "../middlewares/validate.middleware"

const router = require("express").Router()

const createReservaSchema = z.object({
  smartlock_id: z.coerce.number().int().positive("smartlock_id inválido"),
  dt_reserva: z.string().min(1, "Data da reserva é obrigatória"),
  dt_devolucao: z.string().min(1, "Data de devolução é obrigatória"),
  equipamentos: z
    .array(z.coerce.number().int().positive())
    .min(1, "É necessário pelo menos um equipamento selecionado"),
});

const updateReservaSchema = z.object({
  id: z.coerce.number().int().positive("ID da reserva inválido"),
  dt_reserva: z.string().min(1, "Data da reserva é obrigatória"),
  dt_devolucao: z.string().min(1, "Data de devolução é obrigatória"),
  equipamentos: z
    .array(z.coerce.number().int().positive())
    .min(1, "É necessário pelo menos um equipamento selecionado"),
  motivo: z.string().optional(),
});

router.post('/', authMiddleware, validateBody(createReservaSchema), reservaController.create)

router.get('/',authMiddleware,reservaController.reservasDoUsuario)

router.get('/vigente',authMiddleware,reservaController.getReservaVigente)

router.get('/relatorio',authMiddleware,reservaController.relatorio)

router.get('/:id',authMiddleware,reservaController.getById)

router.put('/', authMiddleware, validateBody(updateReservaSchema), reservaController.update)

router.delete('/:id',authMiddleware,reservaController.delete)

module.exports = router