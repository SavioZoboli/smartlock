import { Request, Response } from "express";
import systemStatusSingleton from "../system-status/system-status.singleton";

class SystemStatusController{

    async getGeneralStatus(req:Request,res:Response){
        let status = systemStatusSingleton.getAllStatus()
        res.status(200).json(status)
    }

    async getStatus(req:Request,res:Response){
        let module = req.params.module;
        if(!module || typeof module != 'string'){
            return res.status(400).json({message:"Módulo não informado"})
        }
        switch (module){
            case 'mqtt':
                let mqttStatus = systemStatusSingleton.getMqttStatus()
                return res.status(200).json(mqttStatus)
            case 'database':
                let databaseStatus = systemStatusSingleton.getDatabaseStatus()
                return res.status(200).json(databaseStatus)
            default:
                return res.status(404).json({message:"Módulo não encontrado"})
        }

    }

    async setMqttStatus(req:Request,res:Response){
        let {worker,broker} = req.body
        systemStatusSingleton.setMqttStatus(worker,broker)
        return res.status(200).json({message:"Ok"})
    }

}

export default new SystemStatusController()