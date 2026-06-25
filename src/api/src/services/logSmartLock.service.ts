import sequelize from "../config/database"
import {LogSmartlock} from "../models/index.model"

class LogSmartlockService{


    async gravarLog(id:number,status:string){
        try{
            await LogSmartlock.create({
                smartlock_id:id,
                operacao:status,
            })
            return true
        }catch(e){
            throw e;
        }
    }

}

export default new LogSmartlockService();