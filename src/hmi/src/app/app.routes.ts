import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { adminGuard, authGuard } from '../guards/auth.guard';

export const routes: Routes = [
  // 1. Rotas Públicas (lazy-loaded)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
    title: 'SmartLock | Login',
  },
  {
    path: 'concluir-cadastro',
    loadComponent: () =>
      import('./pages/concluir-cadastro/concluir-cadastro').then((m) => m.ConcluirCadastro),
    title: 'SmartLock | Concluir Cadastro',
  },

  // 2. Rotas Privadas sob um único MainLayoutComponent (evita destruir/recriar a navbar)
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'SmartLock | Dashboard',
      },

      // Relatórios
      {
        path: 'relatorios/disponibilidade',
        loadComponent: () =>
          import('./reports/smartlock-report/smartlock-report').then((m) => m.SmartlockReport),
        title: 'SmartLock | Relatório de Disponibilidade',
      },
      {
        path: 'relatorios/extrato',
        loadComponent: () =>
          import('./reports/extrato-emprestimos/extrato-emprestimos').then(
            (m) => m.ExtratoEmprestimosComponent,
          ),
        title: 'SmartLock | Extrato de Empréstimos',
      },
      {
        path: 'relatorios/reservas',
        loadComponent: () =>
          import('./reports/report-reserva-calendario/report-reserva-calendario').then(
            (m) => m.ReportReservaCalendario,
          ),
        title: 'SmartLock | Relatório de Reservas',
      },

      // Movimentações e Reservas
      {
        path: 'movimentacoes/lista',
        loadComponent: () =>
          import('./pages/movimentacao/lista-movimentacao/lista-movimentacao').then(
            (m) => m.ListaMovimentacao,
          ),
        title: 'SmartLock | Histórico de Movimentações',
      },
      {
        path: 'movimentacoes/cadastro',
        loadComponent: () =>
          import('./pages/movimentacao/cadastro-movimentacao/cadastro-movimentacao').then(
            (m) => m.CadastroMovimentacao,
          ),
        title: 'SmartLock | Nova Movimentação',
      },
      {
        path: 'reservas/lista',
        loadComponent: () =>
          import('./pages/reserva/lista-reserva/lista-reserva').then((m) => m.ListaReserva),
        title: 'SmartLock | Reservas',
      },
      {
        path: 'reservas/cadastro',
        loadComponent: () =>
          import('./pages/reserva/cadastro-reserva/cadastro-reserva').then(
            (m) => m.CadastroReserva,
          ),
        title: 'SmartLock | Nova Reserva',
      },
      {
        path: 'reservas/editar/:id',
        loadComponent: () =>
          import('./pages/reserva/cadastro-reserva/cadastro-reserva').then(
            (m) => m.CadastroReserva,
          ),
        title: 'SmartLock | Editar Reserva',
      },

      // Grupo Administrativo (compartilha o mesmo MainLayoutComponent)
      {
        path: '',
        canActivateChild: [adminGuard],
        children: [
          {
            path: 'unidades/lista',
            loadComponent: () =>
              import('./pages/unidade/lista-unidade/lista-unidade').then((m) => m.ListaUnidade),
            title: 'SmartLock | Unidades',
          },
          {
            path: 'usuarios/lista',
            loadComponent: () =>
              import('./pages/usuario/lista-usuario/lista-usuario').then((m) => m.ListaUsuario),
            title: 'SmartLock | Usuários',
          },
          {
            path: 'smartlocks/lista',
            loadComponent: () =>
              import('./pages/smartlock/lista-smartlock/lista-smartlock').then(
                (m) => m.ListaSmartlock,
              ),
            title: 'SmartLock | Smartlocks',
          },
          {
            path: 'equipamentos/lista',
            loadComponent: () =>
              import('./pages/equipamento/lista-equipamento/lista-equipamento').then(
                (m) => m.ListaEquipamento,
              ),
            title: 'SmartLock | Equipamentos',
          },

          {
            path: 'usuarios/cadastro',
            loadComponent: () =>
              import('./pages/usuario/cadastro-usuario/cadastro-usuario').then(
                (m) => m.CadastroUsuario,
              ),
            title: 'SmartLock | Novo Usuário',
          },
          {
            path: 'usuarios/editar/:id',
            loadComponent: () =>
              import('./pages/usuario/cadastro-usuario/cadastro-usuario').then(
                (m) => m.CadastroUsuario,
              ),
            title: 'SmartLock | Editar Usuário',
          },

          {
            path: 'equipamentos/cadastro',
            loadComponent: () =>
              import('./pages/equipamento/cadastro-equipamento/cadastro-equipamento').then(
                (m) => m.CadastroEquipamento,
              ),
            title: 'SmartLock | Novo Equipamento',
          },
          {
            path: 'equipamentos/editar/:id',
            loadComponent: () =>
              import('./pages/equipamento/update-equipamento/update-equipamento').then(
                (m) => m.UpdateEquipamento,
              ),
            title: 'SmartLock | Editar Equipamento',
          },
          {
            path: 'equipamentos/credencial/:id',
            loadComponent: () =>
              import('./pages/equipamento/credencial-equipamento/credencial-equipamento').then(
                (m) => m.CredencialEquipamento,
              ),
            title: 'SmartLock | Credenciais do Equipamento',
          },
          {
            path: 'equipamentos/transferir',
            loadComponent: () =>
              import('./pages/equipamento/redirect-equipamento/redirect-equipamento').then(
                (m) => m.RedirectEquipamento,
              ),
            title: 'SmartLock | Transferir Equipamento',
          },

          {
            path: 'smartlocks/cadastro',
            loadComponent: () =>
              import('./pages/smartlock/cadastro-smartlock/cadastro-smartlock').then(
                (m) => m.CadastroSmartlock,
              ),
            title: 'SmartLock | Novo Smartlock',
          },
          {
            path: 'smartlocks/editar/:id',
            loadComponent: () =>
              import('./pages/smartlock/cadastro-smartlock/cadastro-smartlock').then(
                (m) => m.CadastroSmartlock,
              ),
            title: 'SmartLock | Editar Smartlock',
          },

          {
            path: 'unidades/cadastro',
            loadComponent: () =>
              import('./pages/unidade/cadastro-unidade/cadastro-unidade').then(
                (m) => m.CadastroUnidade,
              ),
            title: 'SmartLock | Nova Unidade',
          },
          {
            path: 'unidades/editar/:id',
            loadComponent: () =>
              import('./pages/unidade/cadastro-unidade/cadastro-unidade').then(
                (m) => m.CadastroUnidade,
              ),
            title: 'SmartLock | Editar Unidade',
          },
        ],
      },
    ],
  },

  {
    path: 'not-allowed',
    loadComponent: () => import('./pages/error/error').then((m) => m.ErrorPageComponent),
    title: 'SmartLock | Acesso Não Autorizado',
    data: {
      codigo: 401,
      titulo: 'Não autorizado',
      mensagem: 'Você não está autorizado a usar essa funcionalidade',
      icone: 'familiar_face_and_zone',
    },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/error/error').then((m) => m.ErrorPageComponent),
    title: 'SmartLock | Página Não Encontrada',
    data: {
      codigo: 404,
      titulo: 'Página não encontrada',
      mensagem: 'A página que você tentou acessar não existe ou foi movida.',
      icone: 'error_outline',
    },
  },
];
