import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface RegiaoAttributes{
    id?:number,
    nome:string
}

export interface RegiaoAttritutesCriacao extends Optional<RegiaoAttributes,'id'>{}

class Regiao extends Model<RegiaoAttributes,RegiaoAttritutesCriacao>{
    declare id:number;
    declare nome:string;
}

Regiao.init({
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        primaryKey:true,
        autoIncrement:true,
      },
      nome:{
        type:DataTypes.STRING(45),
        allowNull:false
      }
},{
    sequelize,
    tableName:'regioes',
    timestamps:false
})

export default Regiao;
