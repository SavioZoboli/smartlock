import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SmartlockReport } from './smartlock-report';
import { EquipamentoService } from '../../services/equipamento.service';
import { UnidadeService } from '../../services/unidade.service';
import { SmartlockService } from '../../services/smartlock.service';
import { SystemNotificationService } from '../../services/system-notification.service';

describe('SmartlockReport', () => {
  let component: SmartlockReport;
  let fixture: ComponentFixture<SmartlockReport>;

  const mockUnidades = [
    { id: 1, nome: 'Unidade Central', regiao_id: 1, entidade: 'Matriz', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockSmartlocks = [
    { id: 10, apelido: 'Armário A', is_online: true, has_equipamentos: true, created_at: new Date(), updated_at: new Date(), unidade: 'Unidade Central', regional: 'Sul' },
  ];

  const mockUnidadeService = {
    listAll: () => of(mockUnidades),
  };

  const mockSmartlockService = {
    listByUnidade: () => of(mockSmartlocks),
  };

  const mockEquipamentoService = {
    buscarRelatorioDisponibilidadePorUnidade: () => of([]),
  };

  const mockNotificationService = {
    notificar: () => {},
    notificarErro: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartlockReport],
      providers: [
        provideAnimationsAsync(),
        { provide: UnidadeService, useValue: mockUnidadeService },
        { provide: SmartlockService, useValue: mockSmartlockService },
        { provide: EquipamentoService, useValue: mockEquipamentoService },
        { provide: SystemNotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartlockReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente com smartlockCtrl desabilitado inicialmente', () => {
    expect(component).toBeTruthy();
    expect(component.smartlockCtrl.disabled).toBe(true);
    expect(component.unidades.length).toBe(1);
  });

  it('deve habilitar smartlockCtrl quando uma unidade válida for selecionada', () => {
    component.unidadeCtrl.setValue(mockUnidades[0]);
    fixture.detectChanges();
    expect(component.smartlockCtrl.enabled).toBe(true);
  });

  it('deve desabilitar smartlockCtrl e limpar estado ao apagar a unidade', () => {
    component.unidadeCtrl.setValue(mockUnidades[0]);
    fixture.detectChanges();
    expect(component.smartlockCtrl.enabled).toBe(true);

    component.limparUnidade();
    fixture.detectChanges();
    expect(component.smartlockCtrl.disabled).toBe(true);
    expect(component.smartlocks.length).toBe(0);
    expect(component.equipamentos().length).toBe(0);
  });
});
