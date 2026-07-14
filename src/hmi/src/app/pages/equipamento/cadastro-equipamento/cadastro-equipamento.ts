import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map, Observable, startWith } from 'rxjs';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { UnidadeService } from '../../../services/unidade.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { Router } from '@angular/router';
import { TIPO_EQUIPAMENTOS } from '../../../shared/tipoEquipamentos.constant';
import { HttpErrorResponse } from '@angular/common/http';

export interface Unidade {
  id: number;
  nome: string;
}

export interface SmartlockOption {
  id: number;
  apelido: string;
}

@Component({
  selector: 'app-cadastro-equipamento',
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './cadastro-equipamento.html',
  styleUrl: './cadastro-equipamento.scss',
})
export class CadastroEquipamento implements OnInit {
  importForm!: FormGroup;
  novoItemForm!: FormGroup;

  tiposEquipamento = TIPO_EQUIPAMENTOS;

  unidadesDisponiveis: Unidade[] = [];
  smartlocksDisponiveis: SmartlockOption[] = [];

  filteredUnidades!: Observable<Unidade[]>;
  filteredSmartlocks!: Observable<SmartlockOption[]>;

  nomeArquivoSelecionado = '';

  constructor(
    private fb: FormBuilder,
    private unidadeService: UnidadeService,
    private smartlockService: SmartlockService,
    private sns: SystemNotificationService,
    private equipamentoService: EquipamentoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.importForm = this.fb.group({
      unidade: [null, [Validators.required, this.objetoSelecionadoValidator]],
      smartlock: [
        { value: null, disabled: true },
        [Validators.required, this.objetoSelecionadoValidator],
      ],
      tipoGlobal: [''],
      equipamentos: this.fb.array([]),
    });

    this.novoItemForm = this.fb.group({
      tag: ['', Validators.required],
      patrimonio: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      tipo: ['', Validators.required],
      apelido:['']
    });

    this.carregarUnidades();

    this.filteredUnidades = this.importForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map((valor) => this.filtrar(valor, this.unidadesDisponiveis, 'nome')),
    );

    this.filteredSmartlocks = this.importForm.get('smartlock')!.valueChanges.pipe(
      startWith(''),
      map((valor) => this.filtrar(valor, this.smartlocksDisponiveis, 'apelido')),
    );
  }

  get equipamentosArray(): FormArray {
    return this.importForm.get('equipamentos') as FormArray;
  }

  private carregarUnidades(): void {
    this.unidadeService.listAll().subscribe({
      next: (res) => {
        console.log(res);
        this.unidadesDisponiveis = res;
      },
      error: (err) => {
        console.log(err);
        this.sns.notificar('Não foi possível carregar as unidades', 'erro');
      },
    });
  }

  // Garante que o valor do controle seja o objeto selecionado no autocomplete
  // (com id), e não apenas o texto digitado sem uma opção escolhida.
  private objetoSelecionadoValidator(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    return valor && typeof valor === 'object' && 'id' in valor ? null : { objetoInvalido: true };
  }

  private filtrar<T extends Record<string, any>>(
    valor: T | string,
    lista: T[],
    campo: string,
  ): T[] {
    const texto = typeof valor === 'string' ? valor : (valor?.[campo] ?? '');
    const filtro = texto.toLowerCase();
    return lista.filter((item) => item[campo].toLowerCase().includes(filtro));
  }

  unidadeDisplayFn(unidade: Unidade): string {
    return unidade?.nome ?? '';
  }

  smartlockDisplayFn(smartlock: SmartlockOption): string {
    return smartlock?.apelido ?? '';
  }

  onUnidadeSelecionada(unidade: Unidade): void {
    this.smartlocksDisponiveis = [];
    const smartlockControl = this.importForm.get('smartlock')!;
    smartlockControl.reset(null);
    smartlockControl.disable();

    this.smartlockService.listByUnidade(unidade.id).subscribe({
      next: (res) => {
        this.smartlocksDisponiveis = res;
        smartlockControl.enable();
      },
      error: (err) => {
        console.log(err);
        this.sns.notificar('Não foi possível carregar os smartlocks da unidade', 'erro');
      },
    });
  }

  // --- ITENS: adição manual ---

  adicionarItem(): void {
    if (this.novoItemForm.invalid) {
      this.novoItemForm.markAllAsTouched();
      return;
    }

    const { tag, patrimonio, tipo,apelido } = this.novoItemForm.value;
    this.equipamentosArray.push(this.criarItemGroup(tag, patrimonio, tipo,apelido));

    // Mantém o tipo selecionado para agilizar o cadastro de vários itens do mesmo tipo em sequência
    this.novoItemForm.reset({ tag: '', patrimonio: '', tipo ,apelido:''});
  }

  removerItem(index: number): void {
    this.equipamentosArray.removeAt(index);
  }

  private criarItemGroup(tag: string, patrimonio: string, tipo: string,apelido:string): FormGroup {
    return this.fb.group({
      tag: [tag, Validators.required],
      patrimonio: [patrimonio, [Validators.required, Validators.pattern(/^\d{6}$/)]],
      tipo: [tipo, Validators.required],
      apelido:[apelido]
    });
  }

  // --- TIPO GLOBAL ---

  aplicarTipoGlobal(): void {
    const tipo = this.importForm.get('tipoGlobal')!.value;
    if (!tipo) return;

    this.equipamentosArray.controls.forEach((grupo) => grupo.get('tipo')!.setValue(tipo));
  }

  // --- IMPORTAÇÃO CSV ---

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.nomeArquivoSelecionado = file.name;
      this.lerCSV(file);
      // Permite selecionar o mesmo arquivo novamente em uma importação futura
      input.value = '';
    }
  }

  private lerCSV(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target?.result as string;
      this.processarDadosCSV(texto);
    };
    reader.readAsText(file, 'UTF-8');
  }

  private processarDadosCSV(texto: string): void {
    const linhas = texto.split('\n');
    const tipoGlobal = this.importForm.get('tipoGlobal')!.value ?? '';
    let importados = 0;

    // Ignora o cabeçalho (i = 1)
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      // Suporta separação por vírgula ou ponto-e-vírgula comum no Excel em PT-BR
      const colunas = linha.includes(';') ? linha.split(';') : linha.split(',');

      if (colunas.length >= 2) {
        const tag = colunas[0].trim();
        const patrimonio = colunas[1].trim();
        this.equipamentosArray.push(this.criarItemGroup(tag, patrimonio, tipoGlobal,''));
        importados++;
      }
    }

    this.sns.notificar(`${importados} equipamento(s) importado(s) do CSV`, 'sucesso');
  }

  // --- SALVAR ---

  salvar(): void {
    if (this.importForm.invalid || this.equipamentosArray.length === 0) {
      this.importForm.markAllAsTouched();
      return;
    }

    const { smartlock, equipamentos } = this.importForm.getRawValue();

    this.equipamentoService.bulkCreate(smartlock.id, equipamentos).subscribe({
      next: (res) => {
        if (res.contagem == this.equipamentosArray.length) {
          this.router.navigate(['/equipamentos/lista']);
          this.sns.notificar(`${res.contagem} equipamentos adicionados`, 'sucesso');
          return;
        }
        this.sns.notificar(
          `Nenhum erro registrado, mas contagem não confere. ${res.contagem}`,
          'sucesso',
        );
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409 && err.error?.duplicados) {
          this.destacarDuplicados(err.error.duplicados);
          this.sns.notificar(err.error.message, 'erro');
          return;
        }
        console.error(err);
        this.sns.notificar(`Erro: ${err.error?.message ?? err.message}`, 'erro');
      },
    });
  }

  private destacarDuplicados(duplicados: string[]): void {
  this.equipamentosArray.controls.forEach((grupo) => {
    const control = grupo.get('patrimonio');
    if (duplicados.includes(control?.value)) {
      control?.setErrors({ duplicado: true });
      control?.markAsTouched();
    }
  });
}

  onCancelar() {
    this.importForm.reset();
    this.router.navigate(['/equipamentos/lista']);
  }
}
