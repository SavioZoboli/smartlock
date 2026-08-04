// src/types/express.d.ts
import { JwtPayload } from 'jsonwebtoken';

export interface UsuarioToken {
  id: number;
  nome: string;
  email: string;
  avatar: string;
  is_admin:boolean;
  regiao_id:number;
}

declare global {
  namespace Express {
    interface Request {
      user?: UsuarioToken;
    }
  }
}