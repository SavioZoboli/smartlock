import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface TipoEquipamentoAttributes {
  id: number;
  nome: string;
  descricao?: string | null;
  has_patrimonio: boolean;
  has_credencial: boolean;
  icone?: string | null;
}

export interface TipoEquipamentoCreationAttributes extends Optional<
  TipoEquipamentoAttributes,
  "id" | "descricao" | "icone"
> {}

class TipoEquipamento extends Model<
  TipoEquipamentoAttributes,
  TipoEquipamentoCreationAttributes
> {
  declare id: number;
  declare nome: string;
  declare descricao?: string | null;
  declare has_patrimonio: boolean;
  declare has_credencial: boolean;
  declare icone?: string | null;
}

TipoEquipamento.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: "uq_nome",
    },
    descricao: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    has_patrimonio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    has_credencial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    icone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "tipos_equipamento",
    timestamps: false,
  },
);

export default TipoEquipamento;
