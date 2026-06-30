import sequelize from "../config/database";
import { SmartLock } from "../models/index.model";
import Smartlock from "../models/smartlock.model";
import logSmartLockService from "./logSmartLock.service";

class SmartLockService{
    async getSmartlockByMac(mac:string):Promise<Smartlock>{
        try{
            let smartlock = await SmartLock.findOne({where:{mac_address:mac}})
            if(!smartlock){
                throw new Error("SMARTLOCK_NOT_FOUND")
            }
            return smartlock;
        }catch(e){
            throw e;
        }
    }

    async setStatus(mac:string,status:string):Promise<{code:number,message:string}>{
        let transaction = await sequelize.transaction();
        let online = status == 'online'
        try{
            let smartlock = await SmartLock.findOne({where:{mac_address:mac,ativo:true},attributes:['id','is_online'],transaction})
            if(!smartlock){
                throw new Error("ERR_SMARTLOCK_NOT_FOUND")
            }
            if(smartlock.is_online == online){
                transaction.rollback()
                return {code:202,message:"Já atualizado"}
            }

            smartlock.is_online = online

            await smartlock.save({transaction})

            await transaction.commit()

            await logSmartLockService.gravarLog(smartlock.id,status)

            return {code:200,message:"Atualizado com sucesso"}
        }catch(e){
            await transaction.rollback()
            throw e;
        }
    }

    async create(mac_address:string,apelido:string,unidade_id:string,has_equipamentos:boolean):Promise<number>{
        try{
            let smartlock = await SmartLock.create({
                mac_address,
                apelido,
                unidade_id,
                has_equipamentos,
                is_online:false,
                ativo:true
            })
            return smartlock.id
        }catch(e){
            throw e;
        }
    }

}

export default new SmartLockService();