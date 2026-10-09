import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CadastroUsuario } from './pages/usuario/cadastro-usuario/cadastro-usuario';
import { SmartlockReport } from './reports/smartlock-report/smartlock-report';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { CadastroEquipamento } from './pages/equipamento/cadastro-equipamento/cadastro-equipamento';
import { CadastroSmartlock } from './pages/smartlock/cadastro-smartlock/cadastro-smartlock';
import { CadastroUnidade } from './pages/unidade/cadastro-unidade/cadastro-unidade';
import { ListaUnidade } from './pages/unidade/lista-unidade/lista-unidade';
import { ListaUsuario } from './pages/usuario/lista-usuario/lista-usuario';
import { ConcluirCadastro } from './pages/concluir-cadastro/concluir-cadastro';
import { adminGuard, authGuard } from '../guards/auth.guard';
import { ErrorPageComponent } from './pages/error/error';
import { ListaSmartlock } from './pages/smartlock/lista-smartlock/lista-smartlock';
import { ListaEquipamento } from './pages/equipamento/lista-equipamento/lista-equipamento';
import { UpdateEquipamento } from './pages/equipamento/update-equipamento/update-equipamento';
import { RedirectEquipamento } from './pages/equipamento/redirect-equipamento/redirect-equipamento';
import { ListaMovimentacao } from './pages/movimentacao/lista-movimentacao/lista-movimentacao';
import { CadastroMovimentacao } from './pages/movimentacao/cadastro-movimentacao/cadastro-movimentacao';
import { ListaReserva } from './pages/reserva/lista-reserva/lista-reserva';
import { CadastroReserva } from './pages/reserva/cadastro-reserva/cadastro-reserva';
import { ExtratoEmprestimosComponent } from './reports/extrato-emprestimos/extrato-emprestimos';

export const routes: Routes = [
  // 1. Rota Pública (Tela de Login ocupa a tela inteira)
  { path: 'login', component: LoginComponent, title: 'SmartLock | Login' },
  { path: 'concluir-cadastro', component: ConcluirCadastro, title: 'SmartLock | Concluir Cadastro' },

  // 2. Rotas Privadas (Padrão de Layout)
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent, // O Layout Base com a Navbar
    children: [
      // Se acessar a raiz vazia, joga pro dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Tela de Dashboard
      { path: 'dashboard', component: Dashboard, title: 'SmartLock | Dashboard' },

      //Telas de relatório
      { path: 'relatorios/disponibilidade', component: SmartlockReport, title: 'SmartLock | Relatório de Disponibilidade' },
      { path: 'relatorios/extrato', component: ExtratoEmprestimosComponent, title: 'SmartLock | Extrato de Empréstimos' },

      { path: 'movimentacoes/lista', component: ListaMovimentacao, title: 'SmartLock | Histórico de Movimentações' },
      { path: 'movimentacoes/cadastro', component: CadastroMovimentacao, title: 'SmartLock | Nova Movimentação' },
      { path: 'reservas/lista', component: ListaReserva, title: 'SmartLock | Reservas' },
      { path: 'reservas/cadastro', component: CadastroReserva, title: 'SmartLock | Nova Reserva' },
      { path: 'reservas/editar/:id', component: CadastroReserva, title: 'SmartLock | Editar Reserva' },
      
    ],
  },

  {
        path: '',
        canActivate: [authGuard,adminGuard],
        component:MainLayoutComponent,
        children: [
          // Telas de listagem
          { path: 'unidades/lista', component: ListaUnidade, title: 'SmartLock | Unidades' },
          { path: 'usuarios/lista', component: ListaUsuario, title: 'SmartLock | Usuários' },
          { path: 'smartlocks/lista', component: ListaSmartlock, title: 'SmartLock | Smartlocks' },
          { path: 'equipamentos/lista', component: ListaEquipamento, title: 'SmartLock | Equipamentos' },

          // Telas de Cadastros
          { path: 'usuarios/cadastro', component: CadastroUsuario, title: 'SmartLock | Novo Usuário' },
          { path: 'usuarios/editar/:id', component: CadastroUsuario, title: 'SmartLock | Editar Usuário' },

          { path: 'equipamentos/cadastro', component: CadastroEquipamento, title: 'SmartLock | Novo Equipamento' },
          { path: 'equipamentos/editar/:id', component: UpdateEquipamento, title: 'SmartLock | Editar Equipamento' },
          { path: 'equipamentos/transferir', component: RedirectEquipamento, title: 'SmartLock | Transferir Equipamento' },

          { path: 'smartlocks/cadastro', component: CadastroSmartlock, title: 'SmartLock | Novo Smartlock' },
          { path: 'smartlocks/editar/:id', component: CadastroSmartlock, title: 'SmartLock | Editar Smartlock' },

          { path: 'unidades/cadastro', component: CadastroUnidade, title: 'SmartLock | Nova Unidade' },
          { path: 'unidades/editar/:id', component: CadastroUnidade, title: 'SmartLock | Editar Unidade' },
        ],
      },

  {
    path: 'not-allowed', // captura qualquer rota não mapeada
    component: ErrorPageComponent,
    title: 'SmartLock | Acesso Não Autorizado',
    data: {
      codigo: 401,
      titulo: 'Não autorizado',
      mensagem: 'Você não está autorizado a usar essa funcionalidade',
      icone: 'familiar_face_and_zone',
    },
  },
  {
    path: '**', // captura qualquer rota não mapeada
    component: ErrorPageComponent,
    title: 'SmartLock | Página Não Encontrada',
    data: {
      codigo: 404,
      titulo: 'Página não encontrada',
      mensagem: 'A página que você tentou acessar não existe ou foi movida.',
      icone: 'error_outline',
    },
  },
  
];
