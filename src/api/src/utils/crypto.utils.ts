// src/utils/crypto.utils.ts
//
// Criptografia bidirecional (AES-256-GCM) para segredos que precisam ser
// recuperados em texto puro (ex.: senhas de credenciais de equipamentos).
//
// - A chave de 256 bits é DERIVADA de process.env.MASTER_KEY via scrypt
//   (nunca usamos a variável de ambiente diretamente como chave).
// - Cada cifragem usa um IV aleatório de 96 bits (recomendação do NIST p/ GCM).
// - O authTag de 128 bits garante integridade: qualquer adulteração do
//   payload no banco faz a descriptografia falhar.
// - Um AAD (dado associado) opcional amarra o ciphertext ao seu contexto
//   (ex.: equipamento_id), impedindo que o payload de uma linha seja copiado
//   para outra e descriptografado com sucesso.
//
// Formato persistido: "v1:<iv b64>:<authTag b64>:<ciphertext b64>"
// Para um texto de 100 bytes isso ocupa ~180 caracteres (cabe em varchar(200)).
import crypto from "crypto";

const ALGORITMO = "aes-256-gcm";
const VERSAO = "v1";
const TAMANHO_CHAVE = 32; // 256 bits
const TAMANHO_IV = 12; // 96 bits
const TAMANHO_TAG = 16; // 128 bits
const SALT_DERIVACAO = "smartlock:credenciais:v1";

/** Tamanho máximo (em bytes UTF-8) do texto puro, para caber em varchar(200). */
export const TAMANHO_MAX_TEXTO_BYTES = 100;

let chaveDerivada: Buffer | null = null;

function obterChave(): Buffer {
  if (chaveDerivada) return chaveDerivada;

  const masterKey = process.env.MASTER_KEY;
  if (!masterKey || masterKey.length < 32) {
    throw new Error("ERR_MASTER_KEY_INVALIDA");
  }

  // Derivação feita uma única vez por processo (scrypt é propositalmente lento).
  chaveDerivada = crypto.scryptSync(masterKey, SALT_DERIVACAO, TAMANHO_CHAVE);
  return chaveDerivada;
}

export function criptografar(textoPuro: string, aad?: string): string {
  const chave = obterChave();
  const iv = crypto.randomBytes(TAMANHO_IV);
  const cipher = crypto.createCipheriv(ALGORITMO, chave, iv, {
    authTagLength: TAMANHO_TAG,
  });
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));

  const cifrado = Buffer.concat([
    cipher.update(textoPuro, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSAO,
    iv.toString("base64"),
    tag.toString("base64"),
    cifrado.toString("base64"),
  ].join(":");
}

export function descriptografar(payload: string, aad?: string): string {
  const partes = payload.split(":");
  if (partes.length !== 4 || partes[0] !== VERSAO) {
    throw new Error("ERR_PAYLOAD_INVALIDO");
  }
  const [, ivB64, tagB64, cifradoB64] = partes as [string, string, string, string];

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  if (iv.length !== TAMANHO_IV || tag.length !== TAMANHO_TAG) {
    throw new Error("ERR_PAYLOAD_INVALIDO");
  }

  const decipher = crypto.createDecipheriv(ALGORITMO, obterChave(), iv, {
    authTagLength: TAMANHO_TAG,
  });
  decipher.setAuthTag(tag);
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));

  // decipher.final() lança erro se o authTag não bater (dado adulterado,
  // chave errada ou AAD diferente).
  return Buffer.concat([
    decipher.update(Buffer.from(cifradoB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

