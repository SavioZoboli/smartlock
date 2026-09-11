//Importações de bibliotecas
import dotenv from 'dotenv';
import systemStatus from './system-status/system-status';


// Importação do cliente MQTT
require('./config/mqtt');

// Garante o carregamento das variáveis de ambiente
dotenv.config();


// Inicializa o envio de status
systemStatus.polling()