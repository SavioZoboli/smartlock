import { Request, Response } from "express";
import smartLockController from "../controllers/smartLock.controller";
import usuarioController from "../controllers/usuario.controller";
import { authMiddleware, handleAdmin, internalAuthMiddleware } from "../middlewares/auth.middleware";

const router = require("express").Router();


router.post("/setStatus",internalAuthMiddleware,smartLockController.setStatus)

router.post("/",authMiddleware,handleAdmin,smartLockController.create)

router.get('/usuariosAutorizados/:mac',internalAuthMiddleware,usuarioController.getUsuariosAutorizados)

router.get('/whoami/:mac',internalAuthMiddleware,smartLockController.whoami)

router.get('/provisionando',authMiddleware,handleAdmin,smartLockController.buscarSmartlocksProvisionando)

router.get('/listByUnidade/:unidade_id',authMiddleware,smartLockController.listByUnidade)

router.get('/',authMiddleware,smartLockController.listAll)

router.get('/:id',authMiddleware,smartLockController.getById)

router.put('/',authMiddleware,handleAdmin,smartLockController.update)

router.delete('/:id',authMiddleware,handleAdmin,smartLockController.delete)


module.exports = router;