export type KpiFormato = 'quantidade' | 'data' | 'percentual' | 'texto';

export interface KpiDefinicao {
  id: string;
  label: string;
  valor?:string|number;
  icon: string;
  formato: KpiFormato;
}

export interface KpiValor {
  id: string;
  valor: number | string;
}

// Catálogo completo de KPIs disponíveis para o usuário configurar.
// Cada um tem um "formato" que indica se representa quantidade, data, % ou texto.
export const KPI_CATALOGO: KpiDefinicao[] = [
  { id: 'equipamentos-comigo',            label: 'Equipamentos comigo',                    icon: 'inventory_2',    formato: 'quantidade' },
  { id: 'proxima-reserva',                label: 'Próxima reserva',                        icon: 'event',          formato: 'data' },
  { id: 'emprestimos-mes',                label: 'Empréstimos esse mês',                   icon: 'swap_horiz',     formato: 'quantidade' },
  { id: 'taxa-disponibilidade',           label: 'Taxa de disponibilidade média',          icon: 'donut_large',    formato: 'percentual' },
  { id: 'equipamento-mais-usado',         label: 'Equipamento mais usado',                 icon: 'star',           formato: 'texto' },
  { id: 'tempo-medio-emprestimo',         label: 'Tempo médio de empréstimo (dias)',       icon: 'schedule',       formato: 'quantidade' },
  { id: 'reservas-pendentes',             label: 'Reservas pendentes de aprovação',        icon: 'pending_actions',formato: 'quantidade' },
  { id: 'ultima-devolucao',               label: 'Última devolução registrada',            icon: 'history',        formato: 'data' },
];

// Seleção padrão exibida quando o usuário ainda não configurou nada
export const KPI_PADRAO: string[] = [
  'equipamentos-comigo',
  'proxima-reserva',
  'emprestimos-mes',
  'tempo-medio-emprestimo',
];