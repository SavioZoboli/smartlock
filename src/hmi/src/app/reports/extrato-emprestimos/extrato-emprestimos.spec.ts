import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ExtratoEmprestimosComponent } from './extrato-emprestimos';
import { EquipamentoService } from '../../services/equipamento.service';
import { UnidadeService } from '../../services/unidade.service';

describe('ExtratoEmprestimosComponent', () => {
  let component: ExtratoEmprestimosComponent;
  let fixture: ComponentFixture<ExtratoEmprestimosComponent>;

  const mockUsuarios = [
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao@empresa.com',
      avatar: 'avatar1.png',
      qtd_equipamentos: 2,
      unidade: 'Matriz',
      unidade_id: 10,
    },
    {
      id: 2,
      nome: 'Maria Souza',
      email: 'maria@empresa.com',
      avatar: 'avatar2.png',
      qtd_equipamentos: 1,
      unidade: 'Filial 1',
      unidade_id: 20,
    },
  ];

  const mockUnidades = [
    { id: 10, nome: 'Matriz', regional: 'Sul' },
    { id: 20, nome: 'Filial 1', regional: 'Norte' },
  ];

  const mockEquipamentoService = {
    buscarQtdEmUsoPorUsuario: () => of(mockUsuarios),
    buscarEquipamentosEmUso: () => of([]),
    buscarHistorico: () => of({ items: [], total: 0, page: 1, pageSize: 10 }),
  };

  const mockUnidadeService = {
    listAll: () => of(mockUnidades),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtratoEmprestimosComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: EquipamentoService, useValue: mockEquipamentoService },
        { provide: UnidadeService, useValue: mockUnidadeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtratoEmprestimosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve carregar dados e unidades ao inicializar', () => {
    expect(component).toBeTruthy();
    expect(component.usuariosAtivos().length).toBe(2);
    expect(component.unidades().length).toBe(2);
  });

  it('deve filtrar usuários por nome via usuarioCtrl', () => {
    component.usuarioCtrl.setValue('joao');
    fixture.detectChanges();
    expect(component.usuariosAtivos().length).toBe(1);
    expect(component.usuariosAtivos()[0].nome).toBe('João Silva');
  });

  it('deve filtrar usuários por unidade selecionada via unidadeCtrl', () => {
    component.unidadeCtrl.setValue(mockUnidades[1] as any);
    fixture.detectChanges();
    expect(component.usuariosAtivos().length).toBe(1);
    expect(component.usuariosAtivos()[0].nome).toBe('Maria Souza');
  });

  it('deve limpar filtros corretamente', () => {
    component.usuarioCtrl.setValue('joao');
    expect(component.usuariosAtivos().length).toBe(1);

    component.limparUsuario();
    fixture.detectChanges();
    expect(component.usuarioCtrl.value).toBe('');
    expect(component.usuariosAtivos().length).toBe(2);
  });
});
