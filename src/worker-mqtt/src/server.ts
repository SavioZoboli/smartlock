// Carrega variáveis de ambiente antes de qualquer módulo
import './config/env';
import { mqttClient } from './config/mqtt';
import systemStatus from './system-status/system-status';

// Inicializa o envio de status
systemStatus.polling();

// Graceful shutdown para reinícios limpos em containers Docker
function shutdown(signal: string) {
  console.log(`[SISTEMA] Recebido ${signal}. Encerrando worker MQTT...`);
  systemStatus.stop();
  mqttClient.end(false, {}, () => {
    console.log('[SISTEMA] Conexão MQTT encerrada.');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
