export interface ISmartlock {
  id: number;
  mac_address: string;
  apelido: string ;
  unidade_id: number | null;
  is_online: boolean;
  has_equipamentos: boolean;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}