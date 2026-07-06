import { Request, Response } from "express";
import smartLockController from "../controllers/smartLock.controller";
import usuarioController from "../controllers/usuario.controller";

const router = require("express").Router();


router.post("/setStatus",smartLockController.setStatus)

router.post("/",smartLockController.create)

router.get('/usuariosAutorizados/:mac',usuarioController.getUsuariosAutorizados)

router.get('/',smartLockController.listAll)

router.get('/:id',smartLockController.getById)

router.put('/',smartLockController.update)

router.delete('/:id',smartLockController.delete)


module.exports = router;