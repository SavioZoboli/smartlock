import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ItensMovimentacaoAttributes{
    movimentacao_id:number;
    equipamento_id:number;
}

class ItensMovimentacao extends Model<ItensMovimentacaoAttributes>{
    declare movimentacao_id:number;
    declare equipamento_id:number
}

ItensMovimentacao.init({
    movimentacao_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:"movimentacoes",
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
    tableName:'itensMovimentacao',
    sequelize,
    timestamps:false
})

export default ItensMovimentacao