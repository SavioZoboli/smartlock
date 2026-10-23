/**
 * Remove acentos (decompõe em base + diacrítico via NFD e descarta a faixa
 * Unicode de diacríticos) e baixa a caixa. Usado nos filtros de tabela
 * pra "sao paulo" encontrar "São Paulo". Estava duplicada, idêntica,
 * em lista-smartlock.ts e lista-usuario.ts.
 */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}