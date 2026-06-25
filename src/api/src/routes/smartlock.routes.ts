import { Request, Response } from "express";
import smartLockController from "../controllers/smartLock.controller";

const router = require("express").Router();

router.get('/',(req:Request,res:Response)=>{
    res.status(200).json({message:"Rota Smartlock acessível"})
})

router.post("/setStatus",smartLockController.setStatus)

router.post("/",smartLockController.create)


module.exports = router;