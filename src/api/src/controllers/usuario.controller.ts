import { Request, Response } from "express";
import usuarioService from "../services/usuario.service";
import authService from "../services/auth.service";
import { verificarToken } from "../utils/jwt.utils";
import { COOKIE_OPTIONS } from "./auth.controller";

class UsuarioController {
  async create(req: Request, res: Response) {
    let b = req.body;

    if (
      !b.uid_rfid ||
      !b.nome ||
      !b.sobrenome ||
      !b.unidade_id ||
      !b.matricula ||
      !b.email
    ) {
      return res.status(400).json({ message: "Dados obrigatórios faltando" });
    }
    if (b.matricula.length != 5) {
      return res
        .status(400)
        .json({ message: "Matrícula não tem 5 caracteres" });
    }

    try {
      let usuario = await usuarioService.create(
        b.uid_rfid,
        b.nome,
        b.sobrenome,
        b.matricula,
        b.unidade_id,
        b.email,
      );
      res.status(201).json({ id: usuario.id });
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async login(req: Request, res: Response) {
    let b = req.body;
    if (!b.mac || !b.uuid) {
      return res.status(400).json({ message: "Faltam dados obrigatórios" });
    }

    try {
      let usuario_id = await usuarioService.login(b.mac, b.uuid);

      if (usuario_id) {
        return res.status(200).json({ codigo: usuario_id });
      } else {
        return res.status(401).json({ message: "Não autorizado" });
      }
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getUsuariosAutorizados(req: Request, res: Response) {
    let mac = req.params.mac as string | undefined;
    if (!mac) {
      return res
        .status(400)
        .json({ message: "Não é possível buscar sem o MAC" });
    }

    try {
      let usuarios = await usuarioService.getUsersSmartlock(mac);
      console.log(usuarios);
      res.status(200).json({ usuarios });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      let usuarios = await usuarioService.listAll();
      res.status(200).json(usuarios);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getById(req: Request, res: Response) {
    let raw_id = req.params.id;
    if (!raw_id || typeof raw_id != "string") {
      return res.status(400).json({ message: "Dados inválidos" });
    }
    let usuario_id = parseInt(raw_id);
    if (isNaN(usuario_id)) {
      return res.status(400).json({ message: "ID é inválido" });
    }
    try {
      let usuario = await usuarioService.getById(usuario_id);
      if (usuario) {
        return res.status(200).json(usuario);
      } else {
        return res.status(404).json({ message: "Usuário não existe" });
      }
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async update(req: Request, res: Response) {
    let { id, nome, sobrenome, email, uuid, matricula, unidade_id } = req.body;
    if (
      !id ||
      !nome ||
      !sobrenome ||
      !email ||
      !uuid ||
      !matricula ||
      !unidade_id
    ) {
      return res.status(400).json({ message: "Dados inválidos" });
    }
    try {
      let usuario = await usuarioService.update(
        id,
        nome,
        sobrenome,
        email,
        uuid,
        matricula,
        unidade_id
      );
      return res.status(200).json({ message: "Alterado" });
    } catch (e) {
        console.log(e)
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deactivate(req:Request,res:Response){
    let raw_id = req.params.id;
    if (!raw_id || typeof raw_id != "string") {
      return res.status(400).json({ message: "Dados inválidos" });
    }
    let usuario_id = parseInt(raw_id);
    if (isNaN(usuario_id)) {
      return res.status(400).json({ message: "ID é inválido" });
    }

    try{
        await usuarioService.deactivate(usuario_id)
        res.status(200).json({message:"Usuário desativado com sucesso"})
    }catch(e){
        res.status(500).json({message:"Erro interno do servidor"})
    }
  }

  async finalizarCadastro(req:Request,res:Response){
    const signupToken = req.body.signupToken
    const {nome,sobrenome,email,uuid,matricula,unidade_id,avatar} = req.body
    if(!signupToken){
      return res.status(401).json({message:"Sem token"})
    }
    let usuario = verificarToken(signupToken)
    if(usuario.email != email){
      return res.status(401).json({message:"Proprietário do e-mail e usuário cadastrado não coincidem"})
    }
    try{
      let usuario = await usuarioService.create(uuid,nome,sobrenome,matricula,unidade_id,email,avatar)
      let token = authService.geraToken(usuario.id,usuario.email,usuario.nome,usuario.avatar)

      res.cookie("token", token, COOKIE_OPTIONS);

      res.status(201).json({message:"Criado"})

    }catch(e){
      res.status(500).json({message:"Erro interno do servidor"})
    }
  }


}

export default new UsuarioController();
