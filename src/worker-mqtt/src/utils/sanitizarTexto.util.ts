/**
 * Remove acentos (decompõe via NFD e descarta diacríticos) e caracteres
 * fora do ASCII imprimível para exibição correta no display OLED (Adafruit_GFX).
 */
export function removerAcentos(valor?: string | null): string {
  if (!valor) return "";
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}
