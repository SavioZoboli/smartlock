// Equipamento dentro de uma smartlock (report de disponibilidade)
export interface Equipamento {
  id: string;
  tipo: string;
  apelido?:string;
  patrimonio: string;
  disponivel: boolean;
  responsavel?: string;
  icone?:string;
}

export interface TipoEquipamento {
  descricao:string;
  icone:string;
}

// Equipamento que está com o usuário logado (report "comigo")
export interface EquipamentoComigo {
  id: string;
  tipo: string;
  apelido?:string;
  patrimonio: string;
  dataRetirada: string;        // ISO date
  smartlock: string;         // unidade / smartlock de origem
  icone?:string
}