import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, startWith, map, firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipamentoService } from '../../../services/equipamento.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { TIPO_EQUIPAMENTOS } from '../../../shared/tipoEquipamentos.constant';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

// Ajuste conforme o model real de SmartLock usado no seu smartlockService.listAll()
interface SmartLock {
  id: number;
  apelido: string;
}

@Component({
  selector: 'app-update-equipamento',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatAutocompleteModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule
  ],
  templateUrl: './update-equipamento.html',
  styleUrls: ['./update-equipamento.scss']
})
export class UpdateEquipamento implements OnInit {
  eqForm: FormGroup;
  smartlocks!: SmartLock[];
  filteredSmartlocks!: Observable<SmartLock[]>;
  tipos = TIPO_EQUIPAMENTOS;

  equipamento_id!: number;
  isLoading = false;
  ativo = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private equipamentoService: EquipamentoService,
    private smartlockService: SmartlockService,
    private sns: SystemNotificationService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.eqForm = this.fb.group({
      smartlock: ['', Validators.required],
      patrimonio: ['', Validators.required],
      tag: ['', Validators.required],
      tipo: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.sns.notificar('Equipamento não informado.', 'erro');
      this.router.navigate(['/equipamentos/lista']);
      return;
    }

    this.equipamento_id = Number(idParam);

    this.inicializarFormulario();
  }

  private async inicializarFormulario(): Promise<void> {
    this.isLoading = true;
    this.eqForm.disable();

    await this.inicializaSmartlocks();
    await this.carregarDadosEquipamento();

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private async inicializaSmartlocks(): Promise<void> {
    this.smartlocks = await firstValueFrom(this.smartlockService.listAll());
    this.initAutocompleteFilter();
  }

  private initAutocompleteFilter(): void {
    this.filteredSmartlocks = this.eqForm.get('smartlock')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  private _filter(value: any): SmartLock[] {
    if (!this.smartlocks) return [];

    const stringValue = typeof value === 'string' ? value : value?.apelido || '';
    const filterValue = stringValue.toLowerCase();

    return this.smartlocks.filter((option) => option.apelido.toLowerCase().includes(filterValue));
  }

  displaySmartlock = (smartlock: SmartLock | string): string => {
    if (!smartlock) return '';
    if (typeof smartlock === 'string') return smartlock;
    return smartlock.apelido;
  };

  private async carregarDadosEquipamento(): Promise<void> {
    try {
      const dados = await firstValueFrom(this.equipamentoService.getById(this.equipamento_id));

      this.ativo = dados.ativo;

      this.eqForm.enable();
      this.eqForm.patchValue({
        patrimonio: dados.patrimonio,
        tag: dados.tag,
        tipo: dados.tipo,
      });

      // Smartlocks já garantidos carregados neste ponto (await em inicializaSmartlocks)
      this.eqForm.get('smartlock')?.setValue(this.smartlocks.find(s => s.id === dados.smartlock_id));
    } catch (err) {
      console.log(err);
      this.sns.notificar('Erro ao carregar Equipamento. Ele pode não existir.', 'erro');
      this.router.navigate(['/equipamentos/lista']);
    }
  }

  salvar(): void {
    if (this.eqForm.valid) {
      const { smartlock, patrimonio, tag, tipo } = this.eqForm.value;

      this.isLoading = true;
      this.eqForm.disable();

      this.equipamentoService.update(this.equipamento_id, patrimonio, tag, tipo, smartlock.id).subscribe({
        next: () => {
          this.sns.notificar('Equipamento atualizado com sucesso!', 'sucesso');
          this.router.navigate(['/equipamentos/lista']);
        },
        error: (err: any) => {
          console.log(err);
          this.sns.notificar(err.message, 'erro');
          this.isLoading = false;
          this.eqForm.enable();
        },
      });
    } else {
      this.eqForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
    }
  }

  onExcluir(): void {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          titulo: 'Excluir equipamento',
          mensagem: `Tem certeza que deseja excluir o equipamento de patrimônio "${this.eqForm.value.patrimonio}"? Esta ação não pode ser desfeita.`,
          textoConfirmar: 'Excluir',
          textoCancelar: 'Cancelar',
        },
      });
  
      dialogRef.afterClosed().subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.executarExclusao();
        }
      });
    }
  
    private executarExclusao(): void {
      this.equipamentoService.delete(this.equipamento_id).subscribe({
        next: () => {
          this.sns.notificar('Equipamento removido com sucesso', 'sucesso');
          this.router.navigate(['/equipamentos/lista']);
        },
        error: (err) => {
          console.log(err);
          this.sns.notificar(err.message, 'erro');
        },
      });
    }

  onCancelar(): void {
    this.router.navigate(['/equipamentos/lista']);
  }
}