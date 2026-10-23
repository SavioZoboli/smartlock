import { FormArray } from '@angular/forms';

export interface ItemEquipamentoCsv {
  tag: string;
  patrimonio: string;
  tipo: string;
  apelido?: string;
}

/**
 * Lê o conteúdo de um arquivo File como texto UTF-8.
 */
export function lerArquivoComoTexto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? '');
    reader.onerror = (e) => reject(e);
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Faz o parsing de dados CSV de equipamentos.
 * Suporta delimitador ',' e ';' (comum no Excel em português).
 * Ignora a primeira linha (cabeçalho).
 */
export function parseEquipamentosCsv(
  conteudoCsv: string,
  tipoPadrao: string = '',
): ItemEquipamentoCsv[] {
  if (!conteudoCsv) return [];

  const linhas = conteudoCsv.split(/\r?\n/);
  const itens: ItemEquipamentoCsv[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    const colunas = linha.includes(';') ? linha.split(';') : linha.split(',');

    if (colunas.length >= 2) {
      const tag = colunas[0].trim();
      const patrimonio = colunas[1].trim();
      if (tag || patrimonio) {
        itens.push({
          tag,
          patrimonio,
          tipo: tipoPadrao,
          apelido: colunas[3]?.trim() ?? '',
        });
      }
    }
  }

  return itens;
}

/**
 * Percorre o FormArray de equipamentos e marca erro 'duplicado' nos patrimônios informados.
 */
export function marcarPatrimoniosDuplicados(
  equipamentosArray: FormArray,
  duplicados: string[],
): void {
  const duplicadosSet = new Set(duplicados);
  equipamentosArray.controls.forEach((grupo) => {
    const control = grupo.get('patrimonio');
    if (control && duplicadosSet.has(control.value)) {
      control.setErrors({ duplicado: true });
      control.markAsTouched();
    }
  });
}

