import { Request, Response } from "express";
import authService from "../services/auth.service";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // exige HTTPS em produção
  sameSite: "strict" as const,
  maxAge: 4 *60 * 60 * 1000, // 4h
  path: "/",
};

class AuthController {
  async handleGoogleAuth(req: Request, res: Response) {
    // Pegamos o token enviado pelo frontend no corpo da requisição
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token não fornecido." });
    }

    try {
      // Aciona o serviço de validação
      const { sessionToken, userData, cadastrado } =
        await authService.processGoogleLogin(token);

      // Configura o Cookie HttpOnly e Secure
      res.cookie("token", sessionToken, COOKIE_OPTIONS);

      let responseBody =  {userData,cadastrado,signupToken:cadastrado==false?sessionToken:null}


      return res.status(200).json(responseBody);
    } catch (error: any) {
      return res
        .status(401)
        .json({ error: "Falha na autenticação", details: error.message });
    }
  }

  async returnMe(req: Request, res: Response) {
    res.json(req.user);
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: undefined });
    res.status(204).send();
  }
}

export default new AuthController();
