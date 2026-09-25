import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Valida que o controle de um mat-autocomplete tenha um OBJETO selecionado
 * (com `id`), e não apenas o texto digitado sem escolher uma opção da lista.
 * Estava duplicada (com nome igual) em cadastro-equipamento.ts; cadastro-smartlock
 * e cadastro-usuario nem tinham essa checagem — só `Validators.required`, o que
 * deixava passar texto livre sem seleção real. Adicionar isso é fix de bug, não
 * só extração.
 */
export function objetoSelecionadoValidator(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  return valor && typeof valor === 'object' && 'id' in valor ? null : { objetoInvalido: true };
}