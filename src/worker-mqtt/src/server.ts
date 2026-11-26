//Importações de bibliotecas
import dotenv from 'dotenv';
import systemStatus from './system-status/system-status';

// Garante o carregamento das variáveis de ambiente
dotenv.config();

// Importação do cliente MQTT
require('./config/mqtt');

// Inicializa o envio de status
systemStatus.polling()
