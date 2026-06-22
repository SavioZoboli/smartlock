import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente do ficheiro .env
dotenv.config();

// Inicializa a instância do Sequelize com os dados da base de dados
const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    dialect: "postgres",
    // Oculta os logs de SQL no terminal se estiver em produção,
    // mas mostra em ambiente de desenvolvimento para ajudar no debug
    logging: false,

    // Configuração do "Pool" de ligações (ótimo para performance com IoT)
    pool: {
      max: 10, // Número máximo de ligações em simultâneo
      min: 0, // Número mínimo de ligações
      acquire: 30000, // Tempo máximo (ms) a tentar ligar antes de dar erro
      idle: 10000, // Tempo (ms) que uma ligação pode ficar inativa antes de ser fechada
    },
  },
);

// Função auxiliar para testarmos a ligação quando o servidor arrancar
export const testarLigacaoBaseDados = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "[DATABASE] Ligação à base de dados PostgreSQL estabelecida com sucesso!",
    );
  } catch (error) {
    console.error("[DATABASE] Não foi possível ligar à base de dados:", error);
    process.exit(1); // Encerra a aplicação se a base de dados estiver em baixo
  }
};

export default sequelize;
