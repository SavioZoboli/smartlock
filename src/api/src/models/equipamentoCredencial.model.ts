import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface EquipamentoCredencialAttributes {
  id: number;
  equipamento_id: number;
  login: string;
  /** Payload cifrado (AES-256-GCM). Nunca contém a senha em texto puro. */
  senha: string | null;
}

interface EquipamentoCredencialCreationAttributes
  extends Optional<EquipamentoCredencialAttributes, "id" | "senha"> {}

class EquipamentoCredencial extends Model<
  EquipamentoCredencialAttributes,
  EquipamentoCredencialCreationAttributes
> {
  declare id: number;
  declare equipamento_id: number;
  declare login: string;
  declare senha: string | null;
}

EquipamentoCredencial.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    equipamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "uq_equipamento",
      references: {
        model: "equipamentos",
        key: "id",
      },
    },
    login: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    senha: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "equipamento_credencial",
    timestamps: false,
    // Garante que a senha cifrada não vaze por acidente em findAll/findOne.
    // Use o scope "comSenha" apenas onde a descriptografia for necessária.
    defaultScope: {
      attributes: { exclude: ["senha"] },
    },
    scopes: {
      comSenha: {
        attributes: { include: ["senha"] },
      },
    },
  },
);

export default EquipamentoCredencial;

