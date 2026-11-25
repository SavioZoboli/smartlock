import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  EquipamentoCredencial,
  EquipamentoCredencialService,
} from '../../../services/equipamento-credencial.service';
import { SystemNotificationService } from '../../../services/system-notification.service';

export interface VerCredencialDialogData {
  equipamento_id: number;
  /** Identificação amigável do equipamento (apelido / patrimônio) */
  descricao: string;
}

/** Máscara fixa: não revela o tamanho real da senha. */
export const SENHA_MASCARADA = '••••••••';

@Component({
  selector: 'app-ver-credencial-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './ver-credencial-dialog.html',
  styleUrls: ['./ver-credencial-dialog.scss'],
})
export class VerCredencialDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<VerCredencialDialog>);
  private credencialService = inject(EquipamentoCredencialService);
  private sns = inject(SystemNotificationService);
  private destroyRef = inject(DestroyRef);
  readonly data = inject<VerCredencialDialogData>(MAT_DIALOG_DATA);

  readonly mascara = SENHA_MASCARADA;

  carregando = signal<boolean>(true);
  revelando = signal<boolean>(false);
  credencial = signal<EquipamentoCredencial | null>(null);
  senhaRevelada = signal<string | null>(null);

  ngOnInit(): void {
    this.credencialService
      .getByEquipamento(this.data.equipamento_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (credencial) => {
          this.credencial.set(credencial);
          this.carregando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.sns.notificarErro(
            err,
            err.status === 404
              ? 'Este equipamento não possui credencial cadastrada'
              : 'Erro ao carregar credencial',
          );
          this.dialogRef.close();
        },
      });
  }

  /** Consome o endpoint de revelação (que grava a auditoria no backend). */
  verSenha(): void {
    if (this.revelando() || this.senhaRevelada() !== null) return;
    this.revelando.set(true);
    this.credencialService
      .revelarSenha(this.data.equipamento_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (senha) => {
          this.senhaRevelada.set(senha);
          this.revelando.set(false);
        },
        error: (err) => {
          this.sns.notificarErro(err, 'Não foi possível revelar a senha');
          this.revelando.set(false);
        },
      });
  }

  fechar(): void {
    // Descarta o texto puro antes de destruir o componente
    this.senhaRevelada.set(null);
    this.dialogRef.close();
  }
}

