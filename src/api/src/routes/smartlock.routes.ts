import { Request, Response } from "express";
import smartLockController from "../controllers/smartLock.controller";
import usuarioController from "../controllers/usuario.controller";
import { authMiddleware, handleAdmin } from "../middlewares/auth.middleware";

const router = require("express").Router();


router.post("/setStatus",smartLockController.setStatus)

router.post("/",authMiddleware,handleAdmin,smartLockController.create)

router.get('/usuariosAutorizados/:mac',usuarioController.getUsuariosAutorizados)

router.get('/',authMiddleware,smartLockController.listAll)

router.get('/:id',authMiddleware,smartLockController.getById)

router.put('/',authMiddleware,handleAdmin,smartLockController.update)

router.delete('/:id',authMiddleware,handleAdmin,smartLockController.delete)

router.get('/listByUnidade/:unidade_id',authMiddleware,smartLockController.listByUnidade)


module.exports = router;