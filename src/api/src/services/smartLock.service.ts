import { Sequelize } from "sequelize";
import sequelize from "../config/database";
import { Equipamento, SmartLock, Unidade } from "../models/index.model";
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

    async create(mac_address:string,apelido:string,unidade_id:number,has_equipamentos:boolean):Promise<number>{
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

    async listAll(){
        try{
            let smartlocks = await Smartlock.findAll({
                where:{ativo:true},
                attributes: [
          "id",
          "apelido",
          "is_online",
          "has_equipamentos",
          [Sequelize.col("unidade.nome"), "unidade"],
          [Sequelize.col("unidade.regional"), "regional"],
        ],
        include: [
          {
            model: Unidade,
            as: "unidade",
            attributes: [], // Array vazio para não gerar um objeto "unidadeLotacao" aninhado extra
          },
        ],
        raw: true,
            })
            return smartlocks
        }catch(e){
            throw e;
        }
    }

    async getById(id:number){
        try{
            let smartlock = await Smartlock.findByPk(id)
            return smartlock;
        }catch(e){
            throw e
        }
    }

    async update(id:number,apelido:string,mac_address:string,unidade_id:number,has_equipamentos:boolean):Promise<Smartlock>{
        try{
            let smartlock = await Smartlock.findByPk(id)
            if(!smartlock) throw new Error("SMARTLOCK_NOT_FOUND")
            smartlock.apelido = apelido
            smartlock.mac_address = mac_address
            smartlock.unidade_id = unidade_id

            if(smartlock.has_equipamentos != has_equipamentos && has_equipamentos == false){
                let count = await Equipamento.count({where:{smartlock_base_id:smartlock.id}})
                if(count>0) throw new Error("ERR_HAS_EQUIPAMENTOS")
            }

            smartlock.has_equipamentos = has_equipamentos
            await smartlock.save()

            return smartlock;
        }catch(e){
            throw e
        }
    }

    async deactivate(id:number):Promise<void>{
        try{
            let smartlock = await SmartLock.findByPk(id)
            if(!smartlock){
                throw new Error("ERR_NOT_FOUND")
            }
            if(await Equipamento.count({where:{smartlock_base_id:smartlock.id}})){
                throw new Error("ERR_EQUIPAMENTOS_VINCULADOS")
            }
            smartlock.ativo = false;
            await smartlock.save()

        }catch(e){
            throw e;
        }
    }

    async listByUnidade(unidade_id:number):Promise<Smartlock[]>{
        try{
            let smartlocks = await Smartlock.findAll({where:{ativo:true,unidade_id},attributes:['id','apelido']})
            return smartlocks;
        }catch(e){
            throw e;
        }
    }

}

export default new SmartLockService();