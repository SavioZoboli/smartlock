import { describe, it, expect } from 'vitest';
import { AbstractControl } from '@angular/forms';
import { objetoSelecionadoValidator } from './objeto-selecionado.validator';

function criarControl(value: any): AbstractControl {
  return { value } as AbstractControl;
}

describe('objetoSelecionadoValidator', () => {
  it('deve retornar null quando o valor for um objeto com id', () => {
    const control = criarControl({ id: 1, nome: 'Unidade Central' });
    expect(objetoSelecionadoValidator(control)).toBeNull();
  });

  it('deve retornar { objetoInvalido: true } quando o valor for string (texto digitado sem selecionar)', () => {
    const control = criarControl('Unidade Central');
    expect(objetoSelecionadoValidator(control)).toEqual({ objetoInvalido: true });
  });

  it('deve retornar { objetoInvalido: true } quando o valor for string vazia', () => {
    const control = criarControl('');
    expect(objetoSelecionadoValidator(control)).toEqual({ objetoInvalido: true });
  });

  it('deve retornar { objetoInvalido: true } quando o valor for null ou undefined', () => {
    const controlNull = criarControl(null);
    expect(objetoSelecionadoValidator(controlNull)).toEqual({ objetoInvalido: true });

    const controlUndefined = criarControl(undefined);
    expect(objetoSelecionadoValidator(controlUndefined)).toEqual({ objetoInvalido: true });
  });

  it('deve retornar { objetoInvalido: true } quando o valor for um objeto sem propriedade id', () => {
    const control = criarControl({ nome: 'Sem ID' });
    expect(objetoSelecionadoValidator(control)).toEqual({ objetoInvalido: true });
  });

  it('deve aceitar id com valor 0 (zero numérico)', () => {
    const control = criarControl({ id: 0, apelido: 'Smartlock 0' });
    expect(objetoSelecionadoValidator(control)).toBeNull();
  });
});
