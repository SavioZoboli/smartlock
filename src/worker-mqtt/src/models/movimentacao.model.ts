import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface MovimentacaoAttributes {
  id: number;
  equipamento_id: number;
  usuario_id: number;
  smartlock_id: number;
  tipo_movimento: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MovimentacaoCreationAttributes extends Optional<
  MovimentacaoAttributes,
  "id"
> {}

class Movimentacao extends Model<
  MovimentacaoAttributes,
  MovimentacaoCreationAttributes
> {
}

Movimentacao.init(
  {
    id: {
      type: DataTypes.INTEGER,
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
    smartlock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "smartlock",
        key: "id",
      },
    },
    tipo_movimento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue:Date.now()
    },
  },
  {
    sequelize,
    tableName: "movimentacoes",
    timestamps: true,
  },
);

export default Movimentacao;