import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { CadastroUsuario } from './pages/usuario/cadastro-usuario/cadastro-usuario';
import { SmartlockReport } from './reports/smartlock-report/smartlock-report';
import { MainLayoutComponent } from './components/main-layout.component/main-layout.component';
import { CadastroEquipamento } from './pages/equipamento/cadastro-equipamento/cadastro-equipamento';
import { CadastroSmartlock } from './pages/smartlock/cadastro-smartlock/cadastro-smartlock';
import { CadastroUnidade } from './pages/unidade/cadastro-unidade/cadastro-unidade';

export const routes: Routes = [
  // 1. Rota Pública (Tela de Login ocupa a tela inteira)
  { path: 'login', component: LoginComponent },

  // 2. Rotas Privadas (Padrão de Layout)
  {
    path: '', 
    component: MainLayoutComponent, // O Layout Base com a Navbar
    children: [
      // Se acessar a raiz vazia, joga pro dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
      
      // Tela de Dashboard
      { path: 'dashboard', component: SmartlockReport },
      
      // Telas de Cadastros
      { path: 'cadastro/usuarios', component: CadastroUsuario },
      { path: 'cadastro/equipamentos', component: CadastroEquipamento },
      { path: 'cadastro/smartlocks', component: CadastroSmartlock },
      {path:'cadastro/unidades',component:CadastroUnidade},
    ]
  },

  // Rota coringa (caso o usuário digite um link que não existe)
  { path: '**', redirectTo: 'login' } 
];
