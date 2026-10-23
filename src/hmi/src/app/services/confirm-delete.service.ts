import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { SystemNotificationService } from './system-notification.service';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog';

interface ConfirmarExclusaoConfig {
  titulo: string;
  mensagem: string;
  excluir$: Observable<any>;
  mensagemSucesso: string;
}

/**
 * Encapsula o padrão idêntico repetido em toda tela de lista (lista-unidade,
 * lista-smartlock, lista-usuario, lista-reserva): abrir o ConfirmDialogComponent,
 * chamar o delete do service, notificar sucesso/erro.
 *
 * Retorna `true` só quando a exclusão de fato aconteceu — o componente usa isso
 * pra saber se deve remover o item da tabela/lista local:
 *
 *   this.confirmDelete.confirmarEExcluir({
 *     titulo: 'Excluir X',
 *     mensagem: `Tem certeza que deseja excluir "${item.nome}"?`,
 *     excluir$: this.xService.delete(item.id),
 *     mensagemSucesso: 'X removido com sucesso',
 *   }).subscribe((excluido) => {
 *     if (excluido) this.dataSource.data = this.dataSource.data.filter(i => i.id !== item.id);
 *   });
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDeleteService {
  private dialog = inject(MatDialog);
  private sns = inject(SystemNotificationService);

  public confirmarEExcluir(config: ConfirmarExclusaoConfig): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: config.titulo,
        mensagem: config.mensagem,
        textoConfirmar: 'Excluir',
        textoCancelar: 'Cancelar',
      },
    });

    return dialogRef.afterClosed().pipe(
      switchMap((confirmado: boolean) => {
        if (!confirmado) return of(false);

        return config.excluir$.pipe(
          tap(() => this.sns.notificar(config.mensagemSucesso, 'sucesso')),
          map(() => true),
          catchError((err) => {
            console.error(err);
            this.sns.notificar(err.message, 'erro');
            return of(false);
          }),
        );
      }),
    );
  }
}