import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ItensReservaAttributes{
    reserva_id:number;
    equipamento_id:number;
}

class ItensReserva extends Model<ItensReservaAttributes>{
    declare reserva_id:number;
    declare equipamento_id:number
}

ItensReserva.init({
    reserva_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:"reservas",
            key:"id"
        }
    },
    equipamento_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:"equipamentos",
            key:"id"
        }
    }
},{
    tableName:'itensReserva',
    sequelize,
    timestamps:false
})

export default ItensReserva