import sequelize from "../config/database";
import {Unidade} from "../models/index.model";

class UnidadeService{

    async create(nome:string,regional:string,entidade:string):Promise<number>{
        try{
            let unidade = await Unidade.create({
                nome,
                regional,
                entidade
            })
            return unidade.id
        }catch(e){
            throw e
        }
    }

    async listAll():Promise<Unidade[]>{
        try{
            let unidades = await Unidade.findAll({raw:true})
            return unidades;
        }catch(e){
            throw e;
        }
    }

    async getById(id:number):Promise<Unidade>{
        try{
            let unidade = await Unidade.findByPk(id);
            if(!unidade){
                throw new Error("UNIDADE_NOT_FOUND")
            }
            return unidade;
        }catch(e){
            throw e;
        }
    }

    async update(id:number,nome:string,regional:string,entidade:string){
        try{
            let unidade = await Unidade.findByPk(id);
            if(!unidade){
                throw new Error("UNIDADE_NOT_FOUND")
            }
            unidade.nome = nome
            unidade.regional = regional
            unidade.entidade = entidade
            await unidade.save()
            return unidade;
        }catch(e){
            throw e;
        }
    }

    async delete(id:number):Promise<void>{
        try{
            let unidade = await Unidade.findByPk(id)
            if(!unidade){
                throw new Error("UNIDADE_NOT_FOUND")
            }
            await unidade.destroy()
        }catch(e){
            throw e
        }
    }

}

export default new UnidadeService();