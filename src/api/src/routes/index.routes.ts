import { Request, Response } from "express";

const router = require("express").Router();

const smartlockRouter = require("./smartlock.routes")
const unidadeRouter = require("./unidade.routes")
const usuarioRouter = require("./usuario.routes")
const authRouter = require("./auth.routes")
const equipamentoRouter = require("./equipamentos.routes")
const kpiRouter = require("./kpi.routes")

router.get('/',(req:Request,res:Response)=>{
    res.status(200).json({message:"API acessível"})
})

router.use(`/smartlock`,smartlockRouter)
router.use(`/unidade`,unidadeRouter)
router.use(`/usuario`,usuarioRouter)
router.use(`/auth`,authRouter)
router.use(`/equipamento`,equipamentoRouter)
router.use(`/kpi`,kpiRouter)

module.exports = router;