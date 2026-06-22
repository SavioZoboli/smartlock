import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize, { testarLigacaoBaseDados } from './config/database';

// Importação das models para sincronização do banco de dados
import './models/index.model';

// Importação do cliente MQTT
import {initMqtt} from './config/mqtt';

// Garante o carregamento das variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais para o caso de você criar um painel web (Frontend) futuramente
app.use(cors());
app.use(express.json());

// Rota HTTP simples apenas para teste de sanidade da API
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    sistema: 'SmartLock API Node.js'
  });
});

// Função assíncrona para orquestrar a inicialização segura do sistema
async function iniciarServidor() {
  console.log('[SISTEMA] Iniciando o ecossistema SmartLock...');

  // 1. Valida se a base de dados PostgreSQL está online e acessível
  await testarLigacaoBaseDados();

  // 2. Sincroniza os Models do Sequelize com o banco de dados
  // O parâmetro '{ alter: true }' é excelente em desenvolvimento pois cria as tabelas
  // automaticamente e atualiza colunas se você modificar os arquivos futuramente.
  try {
    await sequelize.sync({ alter: false });
    console.log('[SISTEMA] Modelos sincronizados e tabelas prontas no PostgreSQL!');
  } catch (error) {
    console.error('[SISTEMA] Falha crítica ao sincronizar tabelas com o banco:', error);
    process.exit(1); // Encerra a aplicação caso falte integridade no banco
  }

  initMqtt();

  // 3. Liga o servidor HTTP Express
  app.listen(PORT, () => {
    console.log(`[SISTEMA] Servidor HTTP operacional na porta ${PORT}`);
    console.log(`[SISTEMA] Teste de status disponível em: http://localhost:${PORT}/status`);
    console.log('-------------------------------------------------------------\n');
  });
}

// Executa a inicialização
iniciarServidor();