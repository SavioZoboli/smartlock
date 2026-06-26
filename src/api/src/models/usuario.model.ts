import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// 1. Definição dos atributos da tabela
interface UsuarioAttributes {
  id: number;
  uid_rfid: string;
  nome: string;
  matricula: string;
  unidade_lotacao_id: number;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Definição dos atributos opcionais no momento da criação (ex: ID e Ativo são gerados/padrão)
interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'ativo'> {}

// 3. Inicialização da Classe do Model
class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes>{
  declare id: number;
  declare uid_rfid: string;
  declare nome: string;
  declare matricula: string;
  declare unidade_lotacao_id: number;
  declare ativo: boolean;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

// 4. Mapeamento para o Banco de Dados
Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uid_rfid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    matricula: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    unidade_lotacao_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'unidades', // Nome da tabela de Unidades no banco
        key: 'id',
      },
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,           // A instância de conexão com o banco
    tableName: 'usuarios',
    timestamps: true,    // Gerencia createdAt e updatedAt automaticamente
  }
);

export default Usuario;