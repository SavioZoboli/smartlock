import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../config/database';

export interface EquipamentoAttributes {
  id: number;
  apelido?:string;
  tag: string;
  patrimonio?: string | null;
  tipo_id: number;
  smartlock_base_id: number;
  status_atual: string;
  usuario_atual_id?: number|null;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EquipamentoCreationAttributes extends Optional<
  EquipamentoAttributes,
  "id" | "apelido" | "patrimonio" | "usuario_atual_id" | "ativo"
> {}

class Equipamento extends Model<
  EquipamentoAttributes,
  EquipamentoCreationAttributes
> {
  declare id: number;
  declare apelido?:string;
  declare tag: string;
  declare patrimonio?: string | null;
  declare tipo_id: number;
  declare smartlock_base_id: number;
  declare status_atual: string;
  declare usuario_atual_id?: number;
  declare ativo: boolean;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

Equipamento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    apelido:{
      type:DataTypes.STRING,
      allowNull:true
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    patrimonio: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    tipo_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "tipos_equipamento",
        key: "id",
      },
    },
    smartlock_base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'smartlocks',
        key: 'id',
      },
    },
    status_atual: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usuario_atual_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "equipamentos",
    timestamps: true,
  },
);

export default Equipamento;