import sequelize from "../config/database"
import {LogSmartlock,SmartLock} from "../models/index.model"

class LogSmartlockService{

    async gravarLog(mac:string,status:string){
        let transaction = await sequelize.transaction();
        try{

            let smartlock = await SmartLock.findOne({where:{mac_address:mac}})

            if(!smartlock){
                throw new Error("SMARTLOCK_NOT_FOUND")
            }

            await LogSmartlock.create({
                smartlock_id:smartlock.dataValues.id,
                operacao:status,
            })

            await transaction.commit()
        }catch(e){
            await transaction.rollback()
            throw e;
        }
    }

}

export default new LogSmartlockService();