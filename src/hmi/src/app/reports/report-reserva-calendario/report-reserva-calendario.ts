import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, combineLatest, debounceTime, switchMap, of, catchError, finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../services/auth.service';
import { ReservaService } from '../../services/reserva.service';
import { UnidadeService } from '../../services/unidade.service';
import { SmartlockService } from '../../services/smartlock.service';
import { UsuarioService } from '../../services/usuario.service';
import { IUnidade } from '../../interfaces/unidade.interface';
import { ISmartlock } from '../../interfaces/smartlock.interface';
import { displayPorCampo, displayUnidadeComRegional } from '../../shared/util/autocomplete-display.util';
import { filtrarLista } from '../../shared/util/autocomplete-filtro.util';
import { normalizarTexto } from '../../shared/util/normalizar-texto.util';

export type ModoCalendario = 'mes' | 'semana';

interface DiaCalendario {
  data: Date;
  numero: number;
  foraDoMes: boolean;
  hoje: boolean;
  reservas: any[];
}

@Component({
  selector: 'app-report-reserva-calendario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './report-reserva-calendario.html',
  styleUrl: './report-reserva-calendario.scss',
})
export class ReportReservaCalendario implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private reservaService = inject(ReservaService);
  private unidadeService = inject(UnidadeService);
  private smartlockService = inject(SmartlockService);
  private usuarioService = inject(UsuarioService);

  unidadeCtrl = new FormControl<string | IUnidade | null>(null);
  smartlockCtrl = new FormControl<string | ISmartlock | null>(null);
  usuarioCtrl = new FormControl<string | any | null>(null);

  unidades: IUnidade[] = [];
  smartlocks: ISmartlock[] = [];
  usuarios: any[] = [];

  filteredUnidades = signal<IUnidade[]>([]);
  filteredSmartlocks = signal<ISmartlock[]>([]);
  filteredUsuarios = signal<any[]>([]);

  reservas = signal<any[]>([]);
  carregando = signal<boolean>(false);

  modoCalendario = signal<ModoCalendario>('mes');
  mesReferencia = new Date();
  dias = signal<DiaCalendario[]>([]);

  private buscaTrigger$ = new Subject<void>();

  readonly nomesDiasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  readonly _displayWithUnidade = displayUnidadeComRegional;
  readonly _displayWithSmartlock = displayPorCampo<ISmartlock>('apelido');
  readonly _displayWithUsuario = (u: any): string => {
    if (!u) return '';
    if (typeof u === 'string') return u;
    const nomeCompleto = `${u.nome || ''} ${u.sobrenome || ''}`.trim();
    return nomeCompleto || u.email || '';
  };

  ngOnInit(): void {
    this.smartlockCtrl.disable({ emitEvent: false });
    this.configurarPipelineBusca();
    this.iniciarObservadoresFiltros();
    this.carregarDadosIniciais();
    this.gerarGradeVazia();
  }

  get labelPeriodo(): string {
    if (this.modoCalendario() === 'semana') {
      const { inicioGrade, fimGrade } = this.obterDatasGrade();
      const fmtInicio = inicioGrade.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      const fmtFim = fimGrade.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${fmtInicio} – ${fmtFim}`;
    }
    return this.mesReferencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  get temFiltroObrigatorio(): boolean {
    const u = this.unidadeCtrl.value;
    const usr = this.usuarioCtrl.value;
    const temUnidade = !!(u && typeof u === 'object' && u.id);
    const temUsuario = !!(usr && typeof usr === 'object' && usr.id);
    return temUnidade || temUsuario;
  }

  alterarModoCalendario(modo: ModoCalendario): void {
    this.modoCalendario.set(modo);
    const hoje = new Date();
    if (
      modo === 'semana' &&
      this.mesReferencia.getFullYear() === hoje.getFullYear() &&
      this.mesReferencia.getMonth() === hoje.getMonth()
    ) {
      this.mesReferencia = hoje;
    }
    this.dispararBusca();
  }

  periodoAnterior(): void {
    if (this.modoCalendario() === 'semana') {
      this.mesReferencia = new Date(
        this.mesReferencia.getFullYear(),
        this.mesReferencia.getMonth(),
        this.mesReferencia.getDate() - 7,
      );
    } else {
      this.mesReferencia = new Date(
        this.mesReferencia.getFullYear(),
        this.mesReferencia.getMonth() - 1,
        1,
      );
    }
    this.dispararBusca();
  }

  periodoSeguinte(): void {
    if (this.modoCalendario() === 'semana') {
      this.mesReferencia = new Date(
        this.mesReferencia.getFullYear(),
        this.mesReferencia.getMonth(),
        this.mesReferencia.getDate() + 7,
      );
    } else {
      this.mesReferencia = new Date(
        this.mesReferencia.getFullYear(),
        this.mesReferencia.getMonth() + 1,
        1,
      );
    }
    this.dispararBusca();
  }

  irParaHoje(): void {
    this.mesReferencia = new Date();
    this.dispararBusca();
  }

  limparUnidade(): void {
    this.unidadeCtrl.setValue(null);
  }

  limparSmartlock(): void {
    this.smartlockCtrl.setValue(null);
  }

  limparUsuario(): void {
    this.usuarioCtrl.setValue(null);
  }

  limparFiltros(): void {
    this.unidadeCtrl.setValue(null);
    this.smartlockCtrl.setValue(null, { emitEvent: false });
    this.usuarioCtrl.setValue(null);
  }

  obterIniciais(nome: string | undefined): string {
    if (!nome) return '?';
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] ?? '';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }

  private dispararBusca(): void {
    this.buscaTrigger$.next();
  }

  private configurarPipelineBusca(): void {
    this.buscaTrigger$
      .pipe(
        debounceTime(50),
        switchMap(() => {
          const u = this.unidadeCtrl.value;
          const sl = this.smartlockCtrl.value;
          const usr = this.usuarioCtrl.value;

          const unidade_id = u && typeof u === 'object' ? u.id : null;
          const smartlock_id = sl && typeof sl === 'object' ? sl.id : null;
          const usuario_id = usr && typeof usr === 'object' ? usr.id : null;

          if (!unidade_id && !usuario_id) {
            this.reservas.set([]);
            this.gerarGradeVazia();
            this.carregando.set(false);
            return of([]);
          }

          const { inicioGrade, fimGrade } = this.obterDatasGrade();
          this.carregando.set(true);

          return this.reservaService
            .getRelatorio({
              unidade_id,
              smartlock_id,
              usuario_id,
              inicio: inicioGrade,
              fim: fimGrade,
            })
            .pipe(
              catchError((err) => {
                console.error('Erro ao carregar reservas do relatório:', err);
                return of([]);
              }),
              finalize(() => {
                this.carregando.set(false);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((dados) => {
        this.reservas.set(Array.isArray(dados) ? dados : []);
        this.gerarDias();
      });
  }

  private carregarDadosIniciais(): void {
    // 1. Carrega Unidades e Usuário Autenticado juntos para garantir que a unidade padrão seja encontrada
    combineLatest([
      this.unidadeService.listAll(),
      this.authService.obterUsuarioAtual(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([unidades, usuario]) => {
          this.unidades = unidades || [];
          this.filteredUnidades.set(this.unidades);

          // Se ainda não houver unidade ou usuário setado, define a unidade do usuário logado
          if (!this.unidadeCtrl.value && !this.usuarioCtrl.value) {
            const idUnidadePadrao = usuario?.unidade_id;
            if (idUnidadePadrao) {
              const unidadePadrao = this.unidades.find((u) => u.id === idUnidadePadrao);
              if (unidadePadrao) {
                this.unidadeCtrl.setValue(unidadePadrao);
              }
            } else if (this.unidades.length > 0 && !usuario?.is_admin) {
              // Se o usuário não tem unidade_id gravado e não é admin, seleciona a primeira unidade
              this.unidadeCtrl.setValue(this.unidades[0]);
            }
          }
        },
        error: (err) => console.error('Erro ao inicializar unidades e usuário:', err),
      });

    // 2. Carrega lista geral de usuários para o autocomplete de Usuário
    this.usuarioService.listAll().subscribe({
      next: (usuarios) => {
        this.usuarios = Array.isArray(usuarios) ? usuarios : [];
        this.filteredUsuarios.set(this.usuarios);
      },
      error: (err) => console.error('Erro ao carregar usuários:', err),
    });
  }

  private iniciarObservadoresFiltros(): void {
    // 1. Unidade
    this.unidadeCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => {
        if (typeof valor === 'string') {
          this.filteredUnidades.set(filtrarLista(this.unidades, valor, 'nome'));
          return;
        }

        this.filteredUnidades.set(this.unidades);
        this.smartlockCtrl.setValue(null, { emitEvent: false });

        if (valor && valor.id) {
          this.smartlockCtrl.enable({ emitEvent: false });
          this.carregarSmartlocksPorUnidade(valor.id);
        } else {
          this.smartlockCtrl.disable({ emitEvent: false });
          this.smartlocks = [];
          this.filteredSmartlocks.set([]);
        }

        this.dispararBusca();
      });

    // 2. Smartlock
    this.smartlockCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => {
        if (typeof valor === 'string') {
          this.filteredSmartlocks.set(filtrarLista(this.smartlocks, valor, 'apelido'));
          return;
        }
        this.filteredSmartlocks.set(this.smartlocks);
        this.dispararBusca();
      });

    // 3. Usuário
    this.usuarioCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => {
        if (typeof valor === 'string') {
          const termo = normalizarTexto(valor.trim());
          const filtrados = this.usuarios.filter((u) => {
            const nomeCompleto = normalizarTexto(`${u.nome || ''} ${u.sobrenome || ''}`);
            const email = normalizarTexto(u.email || '');
            return nomeCompleto.includes(termo) || email.includes(termo);
          });
          this.filteredUsuarios.set(filtrados);
          return;
        }
        this.filteredUsuarios.set(this.usuarios);
        this.dispararBusca();
      });
  }

  private carregarSmartlocksPorUnidade(unidadeId: number): void {
    this.smartlockService.listByUnidade(unidadeId).subscribe({
      next: (sls) => {
        this.smartlocks = sls || [];
        this.filteredSmartlocks.set(this.smartlocks);
      },
      error: (err) => console.error('Erro ao buscar smartlocks da unidade:', err),
    });
  }

  private obterDatasGrade(): { inicioGrade: Date; fimGrade: Date } {
    if (this.modoCalendario() === 'semana') {
      const inicioGrade = new Date(this.mesReferencia);
      inicioGrade.setDate(inicioGrade.getDate() - inicioGrade.getDay());
      inicioGrade.setHours(0, 0, 0, 0);

      const fimGrade = new Date(inicioGrade);
      fimGrade.setDate(fimGrade.getDate() + 6);
      fimGrade.setHours(23, 59, 59, 999);

      return { inicioGrade, fimGrade };
    }

    const ano = this.mesReferencia.getFullYear();
    const mes = this.mesReferencia.getMonth();

    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);

    const inicioGrade = new Date(primeiroDiaMes);
    inicioGrade.setDate(inicioGrade.getDate() - inicioGrade.getDay());
    inicioGrade.setHours(0, 0, 0, 0);

    const fimGrade = new Date(ultimoDiaMes);
    fimGrade.setDate(fimGrade.getDate() + (6 - fimGrade.getDay()));
    fimGrade.setHours(23, 59, 59, 999);

    return { inicioGrade, fimGrade };
  }

  private gerarGradeVazia(): void {
    const mes = this.mesReferencia.getMonth();
    const isSemana = this.modoCalendario() === 'semana';
    const { inicioGrade, fimGrade } = this.obterDatasGrade();
    const hoje = new Date();
    const listaDias: DiaCalendario[] = [];

    for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
      const diaAtual = new Date(d);
      listaDias.push({
        data: diaAtual,
        numero: diaAtual.getDate(),
        foraDoMes: !isSemana && diaAtual.getMonth() !== mes,
        hoje: this.mesmoDia(diaAtual, hoje),
        reservas: [],
      });
    }

    this.dias.set(listaDias);
  }

  private gerarDias(): void {
    const mes = this.mesReferencia.getMonth();
    const isSemana = this.modoCalendario() === 'semana';
    const { inicioGrade, fimGrade } = this.obterDatasGrade();
    const hoje = new Date();
    const listaDias: DiaCalendario[] = [];

    for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
      const diaAtual = new Date(d);
      listaDias.push({
        data: diaAtual,
        numero: diaAtual.getDate(),
        foraDoMes: !isSemana && diaAtual.getMonth() !== mes,
        hoje: this.mesmoDia(diaAtual, hoje),
        reservas: this.reservasDoDia(diaAtual),
      });
    }

    this.dias.set(listaDias);
  }

  private mesmoDia(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private reservasDoDia(dia: Date): any[] {
    const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0, 0).getTime();
    const fimDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59, 999).getTime();

    return this.reservas()
      .filter((r: any) => {
        if (!r.reserva_inicio) return false;
        const inicioReserva = new Date(r.reserva_inicio).getTime();
        const fimReserva = r.reserva_fim ? new Date(r.reserva_fim).getTime() : inicioReserva;
        return inicioReserva <= fimDia && fimReserva >= inicioDia;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.reserva_inicio).getTime() - new Date(b.reserva_inicio).getTime(),
      );
  }
}