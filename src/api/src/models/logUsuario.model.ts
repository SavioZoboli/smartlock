import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import sequelize from '../config/database';

interface LogUsuarioAttributes {
  id: number;
  usuario_id?: number;
  smartlock_id: number;
  uid_lido: string;
  operacao: string;
  timestamp: string;
}

interface LogUsuarioCreationAttributes extends Optional<
  LogUsuarioAttributes,
  "id" | "usuario_id"
> {}

class LogUsuario extends Model<
  LogUsuarioAttributes,
  LogUsuarioCreationAttributes
> {
}

LogUsuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario_id:{
        type:DataTypes.INTEGER,
        allowNull:true,
        references:{
            model:'usuarios',
            key:'id'
        }
    },
    smartlock_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:'smartlocks',
            key:'id'
        }
    },
    uid_lido:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    operacao:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    timestamp:{
        type:DataTypes.DATE,
        allowNull:false,
        defaultValue:Sequelize.fn("NOW")
    }
  },
  {
    sequelize,
    tableName: "logs_usuario",
    timestamps: false,
  },
);

export default LogUsuario;