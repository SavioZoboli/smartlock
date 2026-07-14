import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EquipamentoService } from '../../services/equipamento.service';
import { EquipamentoComigo } from '../../models/equipamento.model';
import { TIPO_EQUIPAMENTOS } from '../../shared/tipoEquipamentos.constant';

@Component({
  selector: 'app-equipamentos-comigo-report',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './equipamentos-comigo-report.html',
  styleUrls: ['./equipamentos-comigo-report.scss']
})
export class EquipamentosComigoReport implements OnInit {
  equipamentos: EquipamentoComigo[] = [];
  carregando = signal(false)
  private tiposEquipamentos = TIPO_EQUIPAMENTOS

  constructor(private equipamentoService: EquipamentoService) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando.update(()=>true);
    this.equipamentoService.buscarEquipamentosComigo().subscribe({
      next: (res) => {
        this.equipamentos = res.map((linha:any)=>{return {...linha,icone:this.tiposEquipamentos.find(t=>t.descricao==linha.tipo)?.icone}});
        this.carregando.update(()=>false);
      },
      error: (e) => {
        console.log(e)
        this.carregando.update(()=>false);
      }
    });
  }
}