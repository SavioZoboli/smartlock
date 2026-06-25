import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface UnidadesAttributes {
  id: number;
  nome: string;
  regional: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UnidadeCreationAttributes extends Optional<
  UnidadesAttributes,
  "id" | "ativo"
> {}

class Unidade extends Model<UnidadesAttributes, UnidadeCreationAttributes> {
  declare id: number;
  declare nome: string;
  declare regional: string;
  declare ativo: boolean;
}

Unidade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(24),
      allowNull: false,
      unique: true,
    },
    regional: {
      type: DataTypes.STRING(24),
      allowNull: false,
      unique: false,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "unidades",
    timestamps: true,
  },
);

export default Unidade;