import { Request, Response } from "express";
import usuarioService from "../services/usuario.service";

class UsuarioController{

    async create(req:Request,res:Response){
        let b = req.body;

        if(!b.uid_rfid || !b.nome || !b.unidade_id || !b.matricula){
            return res.status(400).json({message:"Dados obrigatórios faltando"})
        }
        if(b.matricula.length != 5){
            return res.status(400).json({message:"Matrícula não tem 5 caracteres"})
        }

        try{
            let usuario_id = await usuarioService.create(b.uid_rfid,b.nome,b.matricula,b.unidade_id)
            res.status(201).json({id:usuario_id})
        }catch(e){
            return res.status(500).json({message:"Erro interno do servidor"})
        }

    }

    async login(req:Request,res:Response){
        let b = req.body;
        if(!b.mac || !b.uuid){
            return res.status(400).json({message:"Faltam dados obrigatórios"})
        }

        try{

            let usuario_id = await usuarioService.login(b.mac,b.uuid)

            if(usuario_id){
                return res.status(200).json({codigo:usuario_id})
            }else{
                return res.status(401).json({message:"Não autorizado"})
            }

        }catch(e:any){
            console.error(e)
            return res.status(500).json({message:"Erro interno do servidor"})
        }
    }

    async getUsuariosAutorizados(req:Request,res:Response){
        let mac = req.params.mac as string|undefined;
        if(!mac){
            return res.status(400).json({message:"Não é possível buscar sem o MAC"})
        }

        try{

            let usuarios = await usuarioService.getUsersSmartlock(mac)
            console.log(usuarios)
            res.status(200).json({usuarios})
        }catch(e){
            console.error(e)
            return res.status(500).json({message:"Erro interno do servidor"})
        }
    }

}

export default new UsuarioController();