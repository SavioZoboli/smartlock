import { DataTypes, Model, Optional, Sequelize } from "sequelize";
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
            model:'smartlocks',
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
        defaultValue:Sequelize.fn("NOW")
    }
  },
  {
    sequelize,
    tableName: "logs_smartlock",
    timestamps: false,
  },
);

export default LogSmartlock;