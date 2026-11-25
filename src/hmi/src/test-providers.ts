import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideEnvironmentNgxMask } from 'ngx-mask';

/**
 * Providers globais aplicados a todos os TestBeds.
 * - Router com rota coringa: satisfaz componentes que injetam ActivatedRoute/Router
 *   e evita erros NG04002 quando o componente navega (ex: `/login`) durante o teste.
 *   Para verificar navegação, use `vi.spyOn(TestBed.inject(Router), 'navigate')`.
 * - HttpClient de teste: nenhuma requisição real sai para a API durante os testes.
 *   Use `TestBed.inject(HttpTestingController)` para inspecionar/responder requisições.
 */
const testProviders: (Provider | EnvironmentProviders)[] = [
  provideRouter([{ path: '**', children: [] }]),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideEnvironmentNgxMask(),
];

export default testProviders;
