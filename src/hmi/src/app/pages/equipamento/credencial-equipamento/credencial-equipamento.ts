import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';

import { EquipamentoService } from '../../../services/equipamento.service';
import {
  EquipamentoCredencial,
  EquipamentoCredencialService,
} from '../../../services/equipamento-credencial.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';

/** Limites alinhados com a API (login varchar(100); senha cifrada cabe em varchar(200)). */
export const TAMANHO_MAX_LOGIN = 100;
export const TAMANHO_MAX_SENHA_BYTES = 100;

/** A API limita a senha em bytes UTF-8 (acentos ocupam 2 bytes). */
export function senhaTamanhoBytesValidator(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (typeof valor !== 'string' || valor.length === 0) return null;
  const bytes = new TextEncoder().encode(valor).length;
  return bytes > TAMANHO_MAX_SENHA_BYTES
    ? { senhaMuitoLonga: { max: TAMANHO_MAX_SENHA_BYTES, atual: bytes } }
    : null;
}

@Component({
  selector: 'app-credencial-equipamento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltip,
  ],
  templateUrl: './credencial-equipamento.html',
  styleUrls: ['./credencial-equipamento.scss'],
})
export class CredencialEquipamento implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private equipamentoService = inject(EquipamentoService);
  private credencialService = inject(EquipamentoCredencialService);
  private sns = inject(SystemNotificationService);
  private confirmDelete = inject(ConfirmDeleteService);

  readonly tamanhoMaxLogin = TAMANHO_MAX_LOGIN;

  equipamento_id!: number;
  descricaoEquipamento = signal<string>('');
  credencial = signal<EquipamentoCredencial | null>(null);
  isLoading = signal<boolean>(false);
  ocultarSenha = signal<boolean>(true);

  credForm = this.fb.nonNullable.group({
    login: ['', [Validators.required, Validators.maxLength(TAMANHO_MAX_LOGIN)]],
    senha: ['', [senhaTamanhoBytesValidator]],
    removerSenha: [false],
  });

  get modoEdicao(): boolean {
    return this.credencial() !== null;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.sns.notificar('Equipamento não informado.', 'erro');
      this.router.navigate(['/equipamentos/lista']);
      return;
    }
    this.equipamento_id = id;

    // "Remover senha" e "nova senha" são mutuamente exclusivos
    this.credForm.controls.removerSenha.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((remover) => {
        const senha = this.credForm.controls.senha;
        if (remover) {
          senha.reset('');
          senha.disable();
        } else {
          senha.enable();
        }
      });

    this.carregar();
  }

  private async carregar(): Promise<void> {
    this.isLoading.set(true);
    this.credForm.disable();
    try {
      const equipamento = await firstValueFrom(
        this.equipamentoService.getById(this.equipamento_id),
      );
      this.descricaoEquipamento.set(
        equipamento.apelido
          ? `${equipamento.apelido} (${equipamento.patrimonio})`
          : equipamento.patrimonio,
      );

      // 404 = equipamento ainda sem credencial → modo cadastro
      const credencial = await firstValueFrom(
        this.credencialService.getByEquipamento(this.equipamento_id).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 404) return of(null);
            throw err;
          }),
        ),
      );
      this.aplicarCredencial(credencial);
      this.credForm.enable();
      this.credForm.controls.removerSenha.setValue(false);
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar credenciais do equipamento');
      this.router.navigate(['/equipamentos/lista']);
    } finally {
      this.isLoading.set(false);
    }
  }

  private aplicarCredencial(credencial: EquipamentoCredencial | null): void {
    this.credencial.set(credencial);
    this.credForm.reset({ login: credencial?.login ?? '', senha: '', removerSenha: false });
  }

  alternarVisibilidadeSenha(): void {
    this.ocultarSenha.update((v) => !v);
  }

  salvar(): void {
    if (this.credForm.invalid) {
      this.credForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
      return;
    }

    const { login, senha, removerSenha } = this.credForm.getRawValue();
    const loginTrim = login.trim();
    if (!loginTrim) {
      this.credForm.controls.login.setErrors({ required: true });
      return;
    }

    // Senha vazia na edição = manter a atual (undefined não é serializado no JSON)
    const senhaEnvio: string | null | undefined = removerSenha ? null : senha || undefined;

    const requisicao$ = this.modoEdicao
      ? this.credencialService.update(this.equipamento_id, loginTrim, senhaEnvio)
      : this.credencialService.create(this.equipamento_id, loginTrim, senhaEnvio ?? undefined);

    this.isLoading.set(true);
    this.credForm.disable();

    requisicao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.sns.notificar(
          this.modoEdicao ? 'Credencial atualizada com sucesso!' : 'Credencial cadastrada com sucesso!',
          'sucesso',
        );
        this.router.navigate(['/equipamentos/editar', this.equipamento_id]);
      },
      error: (err) => {
        this.sns.notificarErro(err);
        this.isLoading.set(false);
        this.credForm.enable();
        if (this.credForm.controls.removerSenha.value) this.credForm.controls.senha.disable();
      },
    });
  }

  onExcluir(): void {
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir credencial',
        mensagem: `Tem certeza que deseja excluir a credencial do equipamento "${this.descricaoEquipamento()}"? Esta ação não pode ser desfeita.`,
        excluir$: this.credencialService.delete(this.equipamento_id),
        mensagemSucesso: 'Credencial removida com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) this.aplicarCredencial(null);
      });
  }

  onCancelar(): void {
    this.router.navigate(['/equipamentos/editar', this.equipamento_id]);
  }
}

