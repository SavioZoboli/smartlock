import { Request, Response } from "express";

const router = require("express").Router();

const smartlockRouter = require("./smartlock.routes")
const unidadeRouter = require("./unidade.routes")

router.get('/',(req:Request,res:Response)=>{
    res.status(200).json({message:"API acessível"})
})

router.use(`/smartlock`,smartlockRouter)
router.use(`/unidade`,unidadeRouter)

module.exports = router;