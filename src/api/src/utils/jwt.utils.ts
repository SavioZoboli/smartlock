// src/utils/jwt.ts
const jwt = require("jsonwebtoken");
import { UsuarioToken } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET!; // nunca hardcoded, sempre via env
const JWT_EXPIRATION = process.env.JWT_EXPIRATION; // token de acesso de vida curta é boa prática


export function verificarToken(token: string): UsuarioToken {
  return jwt.verify(token, JWT_SECRET) as UsuarioToken;
}