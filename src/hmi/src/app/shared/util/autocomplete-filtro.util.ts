import { AbstractControl } from '@angular/forms';
import { Observable, combineLatest, map, startWith } from 'rxjs';

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
    map(([valor, lista]) => {
      const texto = typeof valor === 'string' ? valor : ((valor?.[campo] as string) ?? '');
      const filtro = texto.toLowerCase();
      return (lista ?? []).filter((item) => String(item[campo] ?? '').toLowerCase().includes(filtro));
    }),
  );
}