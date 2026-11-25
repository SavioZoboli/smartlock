export type StatusFiltroDisponibilidade = 'todos' | 'disponiveis' | 'emprestados';

export interface ReservaRelatorioItem {
  usuario: string;
  inicio: string | Date;
  fim: string | Date;
}

export interface ItemRelatorioSmartlock {
  id: number;
  tipo: string;
  patrimonio: string;
  apelido?: string | null;
  disponivel: boolean;
  smartlockId: number;
  smartlockApelido: string;
  avatar?: string | null;
  responsavel?: string | null;
  icone?: string;
  reservas: ReservaRelatorioItem[];
}

export interface GrupoSmartlock {
  smartlockId: number;
  smartlockApelido: string;
  itens: ItemRelatorioSmartlock[];
}

