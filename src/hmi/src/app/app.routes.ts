import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CadastroUsuario } from './pages/usuario/cadastro-usuario/cadastro-usuario';
import { SmartlockReport } from './reports/smartlock-report/smartlock-report';
import { MainLayoutComponent } from './components/main-layout.component/main-layout.component';
import { CadastroEquipamento } from './pages/equipamento/cadastro-equipamento/cadastro-equipamento';
import { CadastroSmartlock } from './pages/smartlock/cadastro-smartlock/cadastro-smartlock';
import { CadastroUnidade } from './pages/unidade/cadastro-unidade/cadastro-unidade';
import { ListaUnidade } from './pages/unidade/lista-unidade/lista-unidade';
import { ListaUsuario } from './pages/usuario/lista-usuario/lista-usuario';
import { ConcluirCadastro } from './pages/concluir-cadastro/concluir-cadastro';
import { authGuard } from '../guards/auth.guard';
import { ErrorPageComponent } from './pages/error/error';

export const routes: Routes = [
  // 1. Rota Pública (Tela de Login ocupa a tela inteira)
  { path: 'login', component: LoginComponent },
  {path:'concluir-cadastro',component:ConcluirCadastro},

  // 2. Rotas Privadas (Padrão de Layout)
  {
    path: '',
    canActivate:[authGuard],
    component: MainLayoutComponent, // O Layout Base com a Navbar
    children: [
      // Se acessar a raiz vazia, joga pro dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Tela de Dashboard
      { path: 'dashboard', component: SmartlockReport },

      { path: 'unidades/lista', component: ListaUnidade },
      { path: 'usuarios/lista', component: ListaUsuario },

      // Telas de Cadastros
      { path: 'usuarios/cadastro', component: CadastroUsuario },
      {path:'usuarios/editar/:id',component:CadastroUsuario},

      { path: 'equipamentos/cadastro', component: CadastroEquipamento },

      { path: 'smartlocks/cadastro', component: CadastroSmartlock },

      { path: 'unidades/cadastro', component: CadastroUnidade },
      { path: 'unidades/editar/:id', component: CadastroUnidade },
    ],
  },

  // Rota coringa (caso o usuário digite um link que não existe)
   {
    path: '**', // captura qualquer rota não mapeada
    component: ErrorPageComponent,
    data: {
      codigo: 404,
      titulo: 'Página não encontrada',
      mensagem: 'A página que você tentou acessar não existe ou foi movida.',
      icone: 'error_outline',
    },
  },
];
