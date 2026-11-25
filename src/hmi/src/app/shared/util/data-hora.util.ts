/** Aceita horas no formato HH:mm (24h). */
export const HORA_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Combina a data (Date) com a hora ("HH:mm"), zerando segundos e milissegundos. */
export function combinarDataHora(data: Date, hora: string): Date {
  const [h, m] = hora.split(':').map(Number);
  const resultado = new Date(data);
  resultado.setHours(h, m, 0, 0);
  return resultado;
}

/** Extrai "HH:mm" de um Date (horário local). */
export function formatarHora(data: Date): string {
  return data.toTimeString().slice(0, 5);
}

