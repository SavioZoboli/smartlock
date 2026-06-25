import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../config/database';

interface SmartlockAttributes {
  id: number;
  mac_address: string;
  apelido: string;
  unidade_id: string;
  is_online: boolean;
  has_equipamentos: boolean;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SmartlockCreationAttributes extends Optional<
  SmartlockAttributes,
  "id"
> {}

class Smartlock extends Model<
  SmartlockAttributes,
  SmartlockCreationAttributes
> {

  declare id: number;
  declare mac_address: string;
  declare apelido: string;
  declare unidade_id: string;
  declare is_online: boolean;
  declare has_equipamentos: boolean;
  declare ativo: boolean;
  declare createdAt?: Date;
  declare updatedAt?: Date;


}

Smartlock.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    mac_address:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false,
    },
    apelido:{
        type:DataTypes.STRING,
        allowNull:false
    },
    unidade_id:{
        type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'unidades', // Nome da tabela de Unidades no banco
        key: 'id',
      },
    },
    is_online:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    has_equipamentos:{
        type:DataTypes.BOOLEAN,
        allowNull:false
    },
    ativo:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:true
    }
  },
  {
    sequelize,
    tableName: "smartlocks",
    timestamps: true,
  },
);

export default Smartlock;
