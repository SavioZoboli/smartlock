import { Request, Response } from "express";
import authService from "../services/auth.service";
import usuarioService from "../services/usuario.service";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // exige HTTPS em produção
  sameSite: "strict" as const,
  maxAge: 15 * 60 * 1000, // 15 min (access token curto)
  path: "/",
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias (renovado via sliding rotation)
  path: "/api/auth",
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
      const { sessionToken, refreshToken, userData, cadastrado } =
        await authService.processGoogleLogin(token);

      // Só grava os cookies de sessão quando o usuário já está cadastrado.
      // Para cadastros pendentes, retorna apenas o signupToken no corpo.
      if (cadastrado) {
        res.cookie("token", sessionToken, COOKIE_OPTIONS);
        if (refreshToken) {
          res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);
        }
      } else {
        res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: undefined });
        res.clearCookie("refresh_token", { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
      }

      let responseBody = {
        userData,
        cadastrado,
        signupToken: cadastrado == false ? sessionToken : null,
      };

      return res.status(200).json(responseBody);
    } catch (error: any) {
      return res
        .status(401)
        .json({ error: "Falha na autenticação" });
    }
  }

  async returnMe(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    try {
      const userDb = await usuarioService.getById(req.user.id);
      return res.json({
        ...req.user,
        unidade_id: (userDb as any)?.unidade_id ?? null,
      });
    } catch {
      return res.json(req.user);
    }
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token ausente" });
    }

    try {
      const tokens = await authService.renovarSessao(refreshToken);
      res.cookie("token", tokens.accessToken, COOKIE_OPTIONS);
      res.cookie("refresh_token", tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      return res.status(200).json({ ok: true });
    } catch {
      res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: undefined });
      res.clearCookie("refresh_token", { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
      return res.status(401).json({ message: "Sessão expirada" });
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: undefined });
    res.clearCookie("refresh_token", { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
    res.status(204).send();
  }

  async returnToken(req:Request,res:Response){
    let googleToken = process.env.GOOGLE_CLIENT_API
    if(!googleToken){
      return res.status(404).json({message:"Token não encontrado"})
    }
    res.status(200).json(googleToken)
  }
}

export default new AuthController();
