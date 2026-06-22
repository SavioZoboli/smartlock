import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../config/database';

interface LogSmartlockAttributes {
  id: number;
  smartlock_id: number;
  operacao: string;
  timestamp?: string;
}

interface LogSmartlockCreationAttributes extends Optional<
  LogSmartlockAttributes,
  "id"|"timestamp"
> {}

class LogSmartlock extends Model<
  LogSmartlockAttributes,
  LogSmartlockCreationAttributes
> {}

LogSmartlock.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    smartlock_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:'smartlock',
            key:'id'
        }
    },
    operacao:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    timestamp:{
        type:DataTypes.DATE,
        allowNull:false,
        defaultValue:Date.now()
    }
  },
  {
    sequelize,
    tableName: "logs_smartlock",
    timestamps: false,
  },
);

export default LogSmartlock;