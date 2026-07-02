import { Request, Response } from "express";
import smartLockController from "../controllers/smartLock.controller";
import usuarioController from "../controllers/usuario.controller";

const router = require("express").Router();

router.get('/',(req:Request,res:Response)=>{
    res.status(200).json({message:"Rota Smartlock acessível"})
})

router.post("/setStatus",smartLockController.setStatus)

router.post("/",smartLockController.create)

router.get('/usuariosAutorizados/:mac',usuarioController.getUsuariosAutorizados)


module.exports = router;