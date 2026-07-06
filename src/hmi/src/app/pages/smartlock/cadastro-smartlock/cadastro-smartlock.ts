import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Observable, startWith, map, firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { Unidade } from '../../unidade/lista-unidade/lista-unidade';
import { UnidadeService } from '../../../services/unidade.service';

@Component({
  selector: 'app-cadastro-smartlocks',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatAutocompleteModule, MatSlideToggleModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  providers: [provideNgxMask()],
  templateUrl: './cadastro-smartlock.html',
  styleUrls: ['./cadastro-smartlock.scss']
})
export class CadastroSmartlock implements OnInit {
  slForm: FormGroup;
  unidades!: Unidade[]
  filteredUnidades!: Observable<Unidade[]>;

  smartlock_id!: number | null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private smartlockService: SmartlockService,
    private sns: SystemNotificationService,
    private cdr: ChangeDetectorRef,
    private unidadeService:UnidadeService
  ) {
    this.slForm = this.fb.group({
      unidade: ['', Validators.required],
      apelido: ['', Validators.required],
      has_equipamentos: [false],
      mac_address: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.smartlock_id = idParam ? Number(idParam) : null;


    this.inicializaUnidades()
    this.inicializarFormulario();
  }

  private async inicializarFormulario(): Promise<void> {
    this.isLoading = true;
    this.slForm.disable();

    if (this.smartlock_id) {
      await this.carregarDadosSmartlock();
    } else {
      this.slForm.enable();
    }

    this.isLoading = false;

    // Mesmo motivo do cadastro-usuario: patchValue dispara valueChanges
    // assincronamente e pode gerar NG0100 sem essa checagem manual.
    this.cdr.detectChanges();
  }

  private inicializaUnidades(){
    this.unidadeService.listAll().subscribe({
      next:(res)=>{
        this.unidades = res;
        this.initAutocompleteFilter()
      }
    })
  }

  private initAutocompleteFilter() {
    this.filteredUnidades = this.slForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  private _filter(value: any): Unidade[] {
    if (!this.unidades) return [];

    const stringValue = typeof value === 'string' ? value : value?.nome || '';
    const filterValue = stringValue.toLowerCase();

    return this.unidades.filter((option) => option.nome.toLowerCase().includes(filterValue));
  }

  displayUnidade = (unidade: Unidade | string): string => {
    if (!unidade) return '';
    if (typeof unidade === 'string') return unidade;
    return `${unidade.nome} / ${unidade.regional}`;
  };

  private async carregarDadosSmartlock(): Promise<void> {
    try {
      const dados = await firstValueFrom(this.smartlockService.getById(this.smartlock_id!));
      console.log(dados)
      this.slForm.enable();
      this.slForm.patchValue(dados);
      this.slForm.get('mac_address')?.setValue(dados.mac_address)
      this.slForm.get('unidade')?.setValue(this.unidades.find(u=>u.id == dados.unidade_id))
      
    } catch (err) {
      console.log(err);
      this.sns.notificar('Erro ao carregar SmartLock. Ele pode não existir.', 'erro');
    }
  }


  salvar(): void {
    if (this.slForm.valid) {
      const { unidade, apelido, mac_address, has_equipamentos } = this.slForm.value;

      this.isLoading = true;
      this.slForm.disable();

      const requisicao$ = this.smartlock_id
        ? this.smartlockService.update(this.smartlock_id, apelido, mac_address, has_equipamentos,unidade.id)
        : this.smartlockService.create(apelido, mac_address, unidade.id, has_equipamentos);

      requisicao$.subscribe({
        next: () => {
          const acao = this.smartlock_id ? 'atualizado' : 'cadastrado';
          this.sns.notificar(`SmartLock ${acao} com sucesso!`, 'sucesso');
          this.router.navigate(['/smartlocks/lista']);
        },
        error: (err: any) => {
          console.log(err)
          this.sns.notificar(err.message, 'erro');
          this.isLoading = false;
          this.slForm.enable();
        },
      });
    } else {
      this.slForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
    }
  }

  onCancelar(): void {
    this.router.navigate(['/smartlocks/lista']);
  }
}