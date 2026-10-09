import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, startWith, map, firstValueFrom, combineLatest } from 'rxjs';
import { Router } from '@angular/router';

import { EquipamentoService } from '../../../services/equipamento.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { ISmartlock } from '../../../interfaces/smartlock.interface';
import { filtrarAutocomplete, filtrarLista } from '../../../shared/util/autocomplete-filtro.util';
import { displayPorCampo } from '../../../shared/util/autocomplete-display.util';
import { objetoSelecionadoValidator } from '../../../shared/validators/objeto-selecionado.validator';
import {
  EquipamentoTransferivel,
  transferirItemParaDestino,
  transferirSelecionadosParaDestino,
  devolverItemParaOrigem,
} from './redirect-equipamento.util';

@Component({
  selector: 'app-redirect-equipamentos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './redirect-equipamento.html',
  styleUrls: ['./redirect-equipamento.scss'],
})
export class RedirectEquipamento implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private equipamentoService = inject(EquipamentoService);
  private smartlockService = inject(SmartlockService);
  private sns = inject(SystemNotificationService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  form: FormGroup = this.fb.group({
    origem: ['', [Validators.required, objetoSelecionadoValidator]],
    destino: [{ value: '', disabled: true }, [Validators.required, objetoSelecionadoValidator]],
  });

  smartlocks: ISmartlock[] = [];
  filteredOrigem!: Observable<ISmartlock[]>;
  filteredDestino!: Observable<ISmartlock[]>;

  origemSelecionada: ISmartlock | null = null;
  destinoSelecionado: ISmartlock | null = null;

  equipamentosDisponiveis: EquipamentoTransferivel[] = [];
  equipamentosParaTransferir: EquipamentoTransferivel[] = [];

  isLoading = false;
  isLoadingEquipamentos = false;

  readonly displaySmartlock = displayPorCampo<ISmartlock>('apelido');

  ngOnInit(): void {
    this.inicializarDados();
  }

  private inicializarDados(): void {
    this.isLoading = true;
    this.smartlockService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (smartlocks) => {
          this.smartlocks = smartlocks;
          this.iniciarFiltros();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.sns.notificarErro(err, 'Erro ao carregar smartlocks');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private iniciarFiltros(): void {
    this.filteredOrigem = filtrarAutocomplete(
      this.form.get('origem')!,
      this.smartlockService.listAll(),
      'apelido',
    );

    this.filteredDestino = combineLatest([
      this.form.get('destino')!.valueChanges.pipe(startWith('')),
      this.smartlockService.listAll(),
      this.form.get('origem')!.valueChanges.pipe(startWith(this.form.get('origem')!.value)),
    ]).pipe(
      map(([valorDestino, smartlocks, origem]) => {
        const origemId = origem && typeof origem === 'object' ? origem.id : null;
        const disponiveis = origemId ? smartlocks.filter((s) => s.id !== origemId) : smartlocks;
        return filtrarLista(disponiveis, valorDestino, 'apelido');
      }),
    );
  }

  async onOrigemSelecionada(): Promise<void> {
    const origem = this.form.get('origem')!.value as ISmartlock;
    if (!origem || typeof origem === 'string') return;

    this.origemSelecionada = origem;

    // Reseta o destino e as listas ao alterar a origem
    this.form.get('destino')!.enable();
    this.form.get('destino')!.setValue('');
    this.destinoSelecionado = null;
    this.equipamentosParaTransferir = [];

    await this.carregarEquipamentosDaOrigem(origem.id);
  }

  limparOrigem(): void {
    this.form.get('origem')?.setValue('');
    this.origemSelecionada = null;
    this.form.get('destino')?.setValue('');
    this.form.get('destino')?.disable();
    this.destinoSelecionado = null;
    this.equipamentosDisponiveis = [];
    this.equipamentosParaTransferir = [];
  }

  onDestinoSelecionada(): void {
    const destino = this.form.get('destino')!.value as ISmartlock;
    if (!destino || typeof destino === 'string') return;
    this.destinoSelecionado = destino;
  }

  limparDestino(): void {
    this.form.get('destino')?.setValue('');
    this.destinoSelecionado = null;
  }

  private async carregarEquipamentosDaOrigem(smartlockId: number): Promise<void> {
    this.isLoadingEquipamentos = true;
    try {
      this.equipamentosDisponiveis = await firstValueFrom(
        this.equipamentoService.listBySmartlock(smartlockId),
      );
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar equipamentos do smartlock de origem.');
      this.equipamentosDisponiveis = [];
    } finally {
      this.isLoadingEquipamentos = false;
      this.cdr.detectChanges();
    }
  }

  get temSelecionados(): boolean {
    return this.equipamentosDisponiveis.some((e) => e.selecionado);
  }

  enviarParaDestino(equipamento: EquipamentoTransferivel): void {
    const res = transferirItemParaDestino(
      this.equipamentosDisponiveis,
      this.equipamentosParaTransferir,
      equipamento,
    );
    this.equipamentosDisponiveis = res.disponiveis;
    this.equipamentosParaTransferir = res.paraTransferir;
  }

  enviarSelecionadosParaDestino(): void {
    const res = transferirSelecionadosParaDestino(
      this.equipamentosDisponiveis,
      this.equipamentosParaTransferir,
    );
    this.equipamentosDisponiveis = res.disponiveis;
    this.equipamentosParaTransferir = res.paraTransferir;
  }

  removerDoDestino(equipamento: EquipamentoTransferivel): void {
    const res = devolverItemParaOrigem(
      this.equipamentosDisponiveis,
      this.equipamentosParaTransferir,
      equipamento,
    );
    this.equipamentosDisponiveis = res.disponiveis;
    this.equipamentosParaTransferir = res.paraTransferir;
  }

  onCancelar(): void {
    this.router.navigate(['/equipamentos/lista']);
  }

  salvar(): void {
    if (this.form.invalid || !this.origemSelecionada) {
      this.form.markAllAsTouched();
      this.sns.notificar('Por favor, selecione smartlocks válidos de origem e destino.', 'erro');
      return;
    }

    if (!this.destinoSelecionado) {
      this.sns.notificar('Selecione o smartlock de destino.', 'erro');
      return;
    }

    if (this.equipamentosParaTransferir.length === 0) {
      this.sns.notificar('Selecione ao menos um equipamento para transferir.', 'erro');
      return;
    }

    this.isLoading = true;
    const equipamentoIds = this.equipamentosParaTransferir.map((e) => e.id);

    this.equipamentoService
      .redirect(this.destinoSelecionado.id, equipamentoIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sns.notificar('Equipamentos redirecionados com sucesso!', 'sucesso');
          this.router.navigate(['/equipamentos/lista']);
        },
        error: (err: any) => {
          this.sns.notificarErro(err);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }
}