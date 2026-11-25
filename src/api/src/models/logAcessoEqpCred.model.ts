import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import sequelize from "../config/database";

export interface LogAcessoEqpCredAttributes {
  /** BIGINT: o pg retorna como string para não perder precisão. */
  id: string;
  equipamento_id: number;
  usuario_id: number;
  timestamp: Date;
}

interface LogAcessoEqpCredCreationAttributes
  extends Optional<LogAcessoEqpCredAttributes, "id" | "timestamp"> {}

class LogAcessoEqpCred extends Model<
  LogAcessoEqpCredAttributes,
  LogAcessoEqpCredCreationAttributes
> {
  declare id: string;
  declare equipamento_id: number;
  declare usuario_id: number;
  declare timestamp: Date;
}

LogAcessoEqpCred.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    equipamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "equipamentos",
        key: "id",
      },
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    // DATE no postgres = timestamptz
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  },
  {
    sequelize,
    tableName: "log_acess_eqp_cred",
    timestamps: false,
  },
);

export default LogAcessoEqpCred;

