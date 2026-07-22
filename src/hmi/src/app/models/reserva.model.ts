export interface ReservaEquipamento {
  id: number;
  nome: string;
  patrimonio: string;
}

export interface Reserva {
  id: number;
  data_hora: string; // ISO 8601
  smartlock_id: number;
  smartlock_apelido: string;
  unidade: string;
  regional: string;
  equipamentos: ReservaEquipamento[];
}