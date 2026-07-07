import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { Observable, startWith, map, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { EquipamentoService } from '../../../services/equipamento.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';

interface SmartLock {
  id: number;
  apelido: string;
}

interface Equipamento {
  id: number;
  patrimonio: string;
  tag: string;
  tipo: string;
  selecionado?: boolean;
}

@Component({
  selector: 'app-redirect-equipamentos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule,
    MatInputModule, MatAutocompleteModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatCheckboxModule,
    MatListModule, MatDividerModule, MatTooltipModule
  ],
  templateUrl: './redirect-equipamento.html',
  styleUrls: ['./redirect-equipamento.scss']
})
export class RedirectEquipamento {
  form: FormGroup;

  smartlocks: SmartLock[] = [];
  filteredOrigem!: Observable<SmartLock[]>;
  filteredDestino!: Observable<SmartLock[]>;

  origemSelecionada: SmartLock | null = null;
  destinoSelecionado: SmartLock | null = null;

  equipamentosDisponiveis: Equipamento[] = [];
  equipamentosParaTransferir: Equipamento[] = [];

  isLoading = false;
  isLoadingEquipamentos = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private equipamentoService: EquipamentoService,
    private smartlockService: SmartlockService,
    private sns: SystemNotificationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      origem: ['', Validators.required],
      destino: [{ value: '', disabled: true }, Validators.required],
    });

    this.init();
  }

  private async init(): Promise<void> {
    this.isLoading = true;
    this.smartlocks = await firstValueFrom(this.smartlockService.listAll());
    this.initFiltros();
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private initFiltros(): void {
    this.filteredOrigem = this.form.get('origem')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value, this.smartlocks)),
    );

    this.filteredDestino = this.form.get('destino')!.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const disponiveis = this.smartlocks.filter(s => s.id !== this.origemSelecionada?.id);
        return this._filter(value, disponiveis);
      }),
    );
  }

  private _filter(value: any, lista: SmartLock[]): SmartLock[] {
    const stringValue = typeof value === 'string' ? value : value?.apelido || '';
    const filterValue = stringValue.toLowerCase();
    return lista.filter((option) => option.apelido.toLowerCase().includes(filterValue));
  }

  displaySmartlock = (smartlock: SmartLock | string): string => {
    if (!smartlock) return '';
    if (typeof smartlock === 'string') return smartlock;
    return smartlock.apelido;
  };

  async onOrigemSelecionada(): Promise<void> {
    const origem = this.form.get('origem')!.value as SmartLock;
    if (!origem || typeof origem === 'string') return;

    this.origemSelecionada = origem;

    // reseta destino e listas
    this.form.get('destino')!.enable();
    this.form.get('destino')!.setValue('');
    this.destinoSelecionado = null;
    this.equipamentosParaTransferir = [];

    await this.carregarEquipamentosDaOrigem(origem.id);
  }

  onDestinoSelecionada(): void {
    const destino = this.form.get('destino')!.value as SmartLock;
    if (!destino || typeof destino === 'string') return;
    this.destinoSelecionado = destino;
  }

  private async carregarEquipamentosDaOrigem(smartlockId: number): Promise<void> {
    this.isLoadingEquipamentos = true;
    try {
      this.equipamentosDisponiveis = await firstValueFrom(
        this.equipamentoService.listBySmartlock(smartlockId)
      );
    } catch (err) {
      console.log(err);
      this.sns.notificar('Erro ao carregar equipamentos do smartlock de origem.', 'erro');
      this.equipamentosDisponiveis = [];
    } finally {
      this.isLoadingEquipamentos = false;
    }
  }

  get temSelecionados(): boolean {
    return this.equipamentosDisponiveis.some(e => e.selecionado);
  }

  enviarParaDestino(equipamento: Equipamento): void {
    this.equipamentosDisponiveis = this.equipamentosDisponiveis.filter(e => e.id !== equipamento.id);
    equipamento.selecionado = false;
    this.equipamentosParaTransferir.push(equipamento);
  }

  enviarSelecionadosParaDestino(): void {
    const selecionados = this.equipamentosDisponiveis.filter(e => e.selecionado);

    this.equipamentosDisponiveis = this.equipamentosDisponiveis.filter(e => !e.selecionado);
    selecionados.forEach(e => e.selecionado = false);
    this.equipamentosParaTransferir.push(...selecionados);
  }

  removerDoDestino(equipamento: Equipamento): void {
    this.equipamentosParaTransferir = this.equipamentosParaTransferir.filter(e => e.id !== equipamento.id);
    this.equipamentosDisponiveis.push(equipamento);
  }

  onCancelar(): void {
    this.router.navigate(['/equipamentos/lista']);
  }

  salvar(): void {
    if (!this.destinoSelecionado) {
      this.sns.notificar('Selecione o smartlock de destino.', 'erro');
      return;
    }

    if (this.equipamentosParaTransferir.length === 0) {
      this.sns.notificar('Selecione ao menos um equipamento para transferir.', 'erro');
      return;
    }

    this.isLoading = true;
    const equipamentoIds = this.equipamentosParaTransferir.map(e => e.id);

    this.equipamentoService.redirect(this.destinoSelecionado.id, equipamentoIds).subscribe({
      next: () => {
        this.sns.notificar('Equipamentos redirecionados com sucesso!', 'sucesso');
        this.router.navigate(['/equipamentos/lista']);
      },
      error: (err: any) => {
        console.log(err);
        this.sns.notificar(err.message, 'erro');
        this.isLoading = false;
      },
    });
  }
}