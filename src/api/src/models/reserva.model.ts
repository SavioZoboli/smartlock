import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ReservaAttributes{
    id?:number;
    usuario_id:number;
    smartlock_id:number;
    reserva_inicio:Date;
    reserva_fim:Date;
    situacao:string;
    motivo?:string;
    createdAt?:string;
    updatedAt?:string;
}

export interface ReservaCreationAttributes extends Optional<ReservaAttributes,'id'|'motivo'|'createdAt'|'updatedAt'>{}

class Reserva extends Model<ReservaAttributes,ReservaCreationAttributes>{
    declare id:number;
    declare usuario_id:number;
    declare reserva_inicio:Date;
    declare reserva_fim:Date;
    declare situacao:string;
    declare motivo?:string;
}

Reserva.init({
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        unique:true,
        allowNull:false,
        autoIncrement:true
    },
    usuario_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:'usuarios',
            key:'id'
        }
    },smartlock_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:'smartlocks',
            key:'id'
        }
    },
    reserva_inicio:{
        type:DataTypes.DATE,
        allowNull:false,
    },
    reserva_fim:{
        type:DataTypes.DATE,
        allowNull:false,
    },
    situacao:{
        type:DataTypes.STRING(20),
        allowNull:false,
        defaultValue:'PENDENTE'
    },
    motivo:{
        type:DataTypes.TEXT,
        allowNull:true
    }
},{
    sequelize,
    tableName:'reservas',
    timestamps:true
})

export default Reserva;