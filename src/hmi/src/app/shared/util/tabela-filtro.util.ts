import { DestroyRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

/**
 * Conecta um FormGroup de filtros a um MatTableDataSource com serialização JSON automática,
 * reset para a primeira página do paginator e cancelamento de subscrição ao destruir o componente.
 */
export function sincronizarFiltroTabela<T, F = any>(
  dataSource: MatTableDataSource<T>,
  formGroup: FormGroup,
  predicate: (data: T, filtro: F) => boolean,
  destroyRef?: DestroyRef,
): Subscription {
  dataSource.filterPredicate = (data: T, filtroJson: string) => {
    try {
      const filtro = JSON.parse(filtroJson);
      return predicate(data, filtro);
    } catch {
      return true;
    }
  };

  const sub = formGroup.valueChanges.subscribe((valores) => {
    dataSource.filter = JSON.stringify(valores);
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  });

  if (destroyRef) {
    destroyRef.onDestroy(() => sub.unsubscribe());
  }

  return sub;
}

