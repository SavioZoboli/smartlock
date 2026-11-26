// src/middlewares/auth.middleware.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt.utils';

let avisouChaveInternaAusente = false;

export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = (process.env.INTERNAL_API_KEY || '').trim();
  if (!expectedKey) {
    if (!avisouChaveInternaAusente) {
      console.warn('[SECURITY] INTERNAL_API_KEY não configurada — rotas internas operando sem validação de chave.');
      avisouChaveInternaAusente = true;
    }
    next();
    return;
  }

  const providedKey = (req.header('x-internal-key') || '').trim();
  const expectedBuf = Buffer.from(expectedKey);
  const providedBuf = Buffer.from(providedKey);

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    res.status(401).json({ message: 'Chave interna inválida ou ausente' });
    return;
  }

  next();
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ message: 'Não autenticado' });
    return;
  }

  try {
    req.user = verificarToken(token);
    next();
  } catch {
    // Cobre token expirado, assinatura inválida, malformado, etc.
    res.status(401).json({ message: 'Sessão inválida ou expirada' });
  }
}

export function handleAdmin(req:Request,res:Response,next:NextFunction){
  if(!req.user || !req.user.is_admin){
    return res.status(401).json({message:"Sem permissão para a operação informada"})
  }
  next();
}