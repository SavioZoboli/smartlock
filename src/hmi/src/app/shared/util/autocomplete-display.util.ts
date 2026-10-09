/**
 * Cria uma função para o `[displayWith]` do mat-autocomplete: devolve o texto
 * digitado (string) ou o `campo` do objeto selecionado. Substitui os
 * `displaySmartlock`/`_displayWithUnidade`/... repetidos nos componentes.
 */
export function displayPorCampo<T extends Record<string, any>>(campo: keyof T) {
  return (valor: T | string | null | undefined): string => {
    if (!valor) return '';
    if (typeof valor === 'string') return valor;
    return String(valor[campo] ?? '');
  };
}

/** Exibe "nome / regional" para autocompletes de unidade. */
export function displayUnidadeComRegional(
  unidade: { nome: string; regional?: string } | string | null | undefined,
): string {
  if (!unidade) return '';
  if (typeof unidade === 'string') return unidade;
  return unidade.regional ? `${unidade.nome} / ${unidade.regional}` : String(unidade.nome ?? '');
}

