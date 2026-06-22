import { roteiaMqttSistema } from "./sistema.routes";

export const rotearMensagemMQTT = async (topico: string, payload: any) => {
  
  // Imprime no terminal apenas para monitorarmos o tráfego (opcional)
  console.log(`[MQTT ROUTER] Mensagem recebida em: ${topico}`);

  // Filtra o endereço MAC do SmartLock usando expressões regulares
  const regexMac = /(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
  const match = topico.match(regexMac);

  // Se o SmartLock não enviou o MAC, ignora a requisição
  if (!match) {
    console.warn(`[MQTT ROUTER] Tópico ignorado (Sem MAC Address válido no sufixo): ${topico}`);
    return;
  }

  // Extrai o MAC para ser consultada no banco de dados
  const macAddress = match[0].toUpperCase();
  console.log(`[MQTT ROUTER] Mensagem recebida do SmartLock [${macAddress}]`);

  // Separa o restante para trabalhar com as rotas
  const partesTopico = topico.split('/');

  try {
    switch (partesTopico[1]){
        case 'usuario':
            console.log("Mensagem recebida para o usuário")
            break;
        case 'equipamento':
            console.log("Mensagem recebida para o equipamento")
            break;
        case 'system':
            roteiaMqttSistema(partesTopico[2]||'',macAddress,payload)
            break;
    }

    // Se chegou até aqui, é um tópico que a API não tem interesse em tratar
    console.log(`[MQTT ROUTER] Tópico ignorado: ${topico}`);

  } catch (error) {
    console.error(`[MQTT ROUTER] Erro interno ao processar a rota do tópico ${topico}:`, error);
  }
};