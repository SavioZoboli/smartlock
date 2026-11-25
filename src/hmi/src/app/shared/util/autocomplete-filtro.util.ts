import { AbstractControl } from '@angular/forms';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { normalizarTexto } from './normalizar-texto.util';

/**
 * Observable filtrado pra um mat-autocomplete: reage tanto à digitação
 * (`control.valueChanges`) quanto à lista fonte (`fonte$`) — que pode ser
 * `service.listAll()` (Observable comum) ou `toObservable(service.algumSignal)`
 * se o service usa CachedResource. Substitui o par
 * `valueChanges + startWith + map + _filter` repetido em cadastro-smartlock,
 * cadastro-usuario e cadastro-reserva.
 */
export function filtrarAutocomplete<T extends Record<string, any>>(
  control: AbstractControl,
  fonte$: Observable<T[]>,
  campo: keyof T,
): Observable<T[]> {
  return combineLatest([control.valueChanges.pipe(startWith('')), fonte$]).pipe(
    map(([valor, lista]) => filtrarLista(lista, valor, campo)),
  );
}

/**
 * Versão pura (sem Observable) do filtro de autocomplete: filtra `lista`
 * pelo `campo`, aceitando como `valor` tanto o texto digitado quanto o objeto
 * já selecionado (nesse caso usa o próprio `campo` do objeto).
 */
export function filtrarLista<T extends Record<string, any>>(
  lista: T[] | null | undefined,
  valor: string | T | null | undefined,
  campo: keyof T,
): T[] {
  const texto = typeof valor === 'string' ? valor : ((valor?.[campo] as string) ?? '');
  const filtro = normalizarTexto(String(texto || '').trim());
  return (lista ?? []).filter((item) =>
    normalizarTexto(String(item[campo] ?? '')).includes(filtro),
  );
}