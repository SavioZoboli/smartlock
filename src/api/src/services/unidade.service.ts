import sequelize from "../config/database";
import {Unidade} from "../models/index.model";

class UnidadeService{

    async create(nome:string,regional:string):Promise<number>{
        try{
            let unidade = await Unidade.create({
                nome,
                regional
            })
            return unidade.id
        }catch(e){
            throw e
        }
    }

}

export default new UnidadeService();