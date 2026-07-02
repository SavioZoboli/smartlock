// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt.utils';

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