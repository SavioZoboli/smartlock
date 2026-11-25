import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { map } from 'rxjs';

import { ConfirmDeleteService } from '../../../services/confirm-delete.service';
import { CadastroTipoEquipamentoDialog } from './cadastro-tipo-equipamento-dialog';

describe('CadastroTipoEquipamentoDialog', () => {
  let fixture: ComponentFixture<CadastroTipoEquipamentoDialog>;
  let component: CadastroTipoEquipamentoDialog;
  let http: HttpTestingController;
  const dialogRef = { close: vi.fn() };
  const confirmDeleteMock = {
    confirmarEExcluir: vi.fn((cfg: any) => cfg.excluir$.pipe(map(() => true))),
  };

  const tiposIniciais = [
    {
      id: 1,
      nome: 'Notebook',
      descricao: 'Notebook padrão',
      icone: 'laptop_chromebook',
      has_patrimonio: true,
      has_credencial: true,
      qtd_equipamentos: 3,
    },
    {
      id: 2,
      nome: 'Microfone',
      descricao: null,
      icone: 'mic',
      has_patrimonio: false,
      has_credencial: false,
      qtd_equipamentos: 0,
    },
  ];

  beforeEach(async () => {
    dialogRef.close.mockReset();
    confirmDeleteMock.confirmarEExcluir.mockClear();

    await TestBed.configureTestingModule({
      imports: [CadastroTipoEquipamentoDialog],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: ConfirmDeleteService, useValue: confirmDeleteMock },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CadastroTipoEquipamentoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();

    http
      .expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/tipo-equipamento'))
      .flush(tiposIniciais);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('deve iniciar no modo lista exibindo os tipos carregados', () => {
    expect(component.modo()).toBe('lista');
    expect(component.tipos().length).toBe(2);
  });

  it('deve filtrar ícones por palavra-chave em português e permitir selecionar da grade', () => {
    component.abrirNovoTipo();
    component.buscaIcone.set('mesa digitalizadora');
    const filtrados = component.iconesFiltrados();
    expect(filtrados.some((i) => i.valor === 'draw')).toBe(true);

    component.selecionarIcone('draw');
    expect(component.form.controls.icone.value).toBe('draw');
    expect(component.seletorIconeAberto()).toBe(false);
  });

  it('deve sugerir ícone customizado do Material Symbols quando não estiver no catálogo', () => {
    component.buscaIcone.set('piano');
    expect(component.iconeCustomDigitado()).toBe('piano');

    component.buscaIcone.set('mic');
    expect(component.iconeCustomDigitado()).toBeNull();
  });

  it('deve criar novo tipo via POST, voltar para a lista e retornar ultimoTipoCriado ao fechar', () => {
    component.abrirNovoTipo();
    component.form.patchValue({
      nome: '  Projetor  ',
      descricao: 'Projetor multimídia',
      icone: 'videocam',
      has_patrimonio: true,
      has_credencial: false,
    });

    component.salvar();

    const reqPost = http.expectOne(
      (r) => r.method === 'POST' && r.url.endsWith('/api/tipo-equipamento'),
    );
    expect(reqPost.request.body).toEqual({
      nome: 'Projetor',
      descricao: 'Projetor multimídia',
      icone: 'videocam',
      has_patrimonio: true,
      has_credencial: false,
    });

    const criado = {
      id: 5,
      nome: 'Projetor',
      descricao: 'Projetor multimídia',
      icone: 'videocam',
      has_patrimonio: true,
      has_credencial: false,
      qtd_equipamentos: 0,
    };
    reqPost.flush(criado);

    http
      .expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/tipo-equipamento'))
      .flush([...tiposIniciais, criado]);

    expect(component.modo()).toBe('lista');
    component.fechar();
    expect(dialogRef.close).toHaveBeenCalledWith({
      alterou: true,
      ultimoTipoCriado: criado,
    });
  });

  it('deve editar um tipo existente via PUT e bloquear exclusão quando houver equipamentos vinculados', () => {
    component.abrirEdicao(tiposIniciais[0]);
    expect(component.modo()).toBe('editar');
    expect(component.podeExcluirTipoEditando()).toBe(false);

    component.onExcluir();
    expect(confirmDeleteMock.confirmarEExcluir).not.toHaveBeenCalled();

    component.form.patchValue({ descricao: 'Notebook atualizado' });
    component.salvar();

    const reqPut = http.expectOne(
      (r) => r.method === 'PUT' && r.url.endsWith('/api/tipo-equipamento/1'),
    );
    expect(reqPut.request.body.descricao).toBe('Notebook atualizado');
    reqPut.flush({ ...tiposIniciais[0], descricao: 'Notebook atualizado' });

    http
      .expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/tipo-equipamento'))
      .flush(tiposIniciais);

    expect(component.modo()).toBe('lista');
  });

  it('deve permitir excluir tipo sem equipamentos vinculados', () => {
    component.abrirEdicao(tiposIniciais[1]);
    expect(component.podeExcluirTipoEditando()).toBe(true);

    component.onExcluir();
    expect(confirmDeleteMock.confirmarEExcluir).toHaveBeenCalled();

    http
      .expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/api/tipo-equipamento/2'))
      .flush({ message: 'Tipo de equipamento removido com sucesso' });

    http
      .expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/tipo-equipamento'))
      .flush([tiposIniciais[0]]);

    expect(component.modo()).toBe('lista');
    expect(component.tipos().length).toBe(1);
  });

  it('deve marcar erro duplicado no campo nome ao receber HTTP 409', () => {
    component.abrirNovoTipo();
    component.form.patchValue({ nome: 'Notebook' });
    component.salvar();

    const reqPost = http.expectOne(
      (r) => r.method === 'POST' && r.url.endsWith('/api/tipo-equipamento'),
    );
    reqPost.flush(
      { message: 'Já existe um tipo de equipamento com este nome' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(component.form.controls.nome.hasError('duplicado')).toBe(true);
    expect(component.modo()).toBe('criar');
  });
});
