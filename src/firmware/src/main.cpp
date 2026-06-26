#include <Arduino.h>
#include "status_feedback_handler.h"
#include "wifi_handler.h"
#include "mqtt_handler.h"
#include "display_handler.h"
#include "rfid_hf_handler.h"
#include "rfid_uhf_handler.h"
#include "hardware_io_handler.h"
#include "auth_handler.h"
#include "buzzer_handler.h"
#include "inventory_manager.h"
#include "storage_handler.h"

bool esperandoNuvem = false;

void setup()
{
    Serial.begin(115200);

    // Inicia o feedback visual e sonoro
    StatusFeedback::init();
    BuzzerHandler::init();
    DisplayHandler::init();

    // Inicializa com tudo desconectado
    DisplayHandler::setIndicators(false, false, false);
    DisplayHandler::setFixedMessage("SMART LOCK", "Inicializando");
    delay(1000);
    // Inicia a rotina de rede (Se estiver sem internet, o portal sobe instantaneamente)
    WiFiHandler::init();

    // Inicia a conexão MQTT
    MqttHandler::init();

    // Inicializa os módulos de RFID
    RfidHfHandler::init();
    UhfHandler::init();

    // Inicializa o módulo de autenticação
    AuthHandler::init();

    // Inicializa a storage
    StorageHandler::init();

    // Delay de inicialização
    // delay(1500);

    // Finaliza a inicialização
    DisplayHandler::setFixedMessage("SMART LOCK", "Aproxime o\nCracha");
}

void loop()
{
    // 1. Atualiza as rotinas de background
    StatusFeedback::update();
    DisplayHandler::update();
    HardwareIOHandler::update();
    AuthHandler::update();

    WiFiHandler::update();
    MqttHandler::update();

    DisplayHandler::setIndicators(
        WiFiHandler::isConnected(),
        MqttHandler::isConnected(),
        !HardwareIOHandler::isDoorOpen());

    char uidLida[16] = {0};

    // Serial.println("[LOOP] Aguardando leitura...");
    //  REGRA 1: NOVO CRACHÁ DETECTADO E NÃO ESTAMOS ESPERANDO NADA
    if (!esperandoNuvem && RfidHfHandler::readTag(uidLida, sizeof(uidLida)))
    {
        Serial.print("UID Lida:");
        Serial.println(uidLida);
        AuthState status = AuthHandler::requestAccess(uidLida);
        BuzzerHandler::play(SoundEffect::TAG_READ);
        if (status == AuthState::GRANTED)
        {
            HardwareIOHandler::unlockDoor();
            BuzzerHandler::play(SoundEffect::OP_SUCCESS);
            DisplayHandler::setTimeoutMessage("SUCESSO", "Autorizado", 5000);
        }
        else if (status == AuthState::DENIED || status == AuthState::ERROR_OFFLINE)
        {
            BuzzerHandler::play(SoundEffect::OP_FAIL);
            DisplayHandler::setTimeoutMessage("NEGADO", "Negado", 3000);
        }
        else if (status == AuthState::PENDING_CLOUD)
        {
            esperandoNuvem = true;
            // CORREÇÃO 1: Texto com no máximo 10 letras por linha para caber nos 128px
            DisplayHandler::setFixedMessage("AGUARDE...", "Validando\nNuvem");
        }
    }

    // REGRA 2: ESTAMOS ESPERANDO A RESPOSTA DO NODE-RED CHEGAR
    if (esperandoNuvem)
    {
        AuthState asyncStatus = AuthHandler::getAsyncStatus();

        // Se a nuvem respondeu algo (Sucesso, Negado ou Timeout) sai do estado Pending
        if (asyncStatus != AuthState::PENDING_CLOUD)
        {
            esperandoNuvem = false;

            // CORREÇÃO 2: Restaura a tela "padrão" silenciosamente no background ANTES de dar o veredito
            DisplayHandler::setFixedMessage("SMART LOCK", "Aproxime o\nCracha");

            if (asyncStatus == AuthState::GRANTED)
            {
                HardwareIOHandler::unlockDoor();
                BuzzerHandler::play(SoundEffect::OP_SUCCESS);
                DisplayHandler::setTimeoutMessage("SUCESSO", "Autorizado", 5000);
            }
            else if (asyncStatus == AuthState::DENIED)
            {
                BuzzerHandler::play(SoundEffect::OP_FAIL);
                DisplayHandler::setTimeoutMessage("NEGADO", "Negado", 3000);
            }
            else if (asyncStatus == AuthState::TIMEOUT_CLOUD)
            {
                BuzzerHandler::play(SoundEffect::OP_FAIL);
                DisplayHandler::setTimeoutMessage("FALHA REDE", "Sem Resposta", 3000);
            }
        }
    }
    // 1. Porta fechou: lemos, calculamos o diff, salvamos o evento
    if (HardwareIOHandler::doorJustClosed())
    {
        // Liga o leitor e espera terminar (bloqueante por 4s aqui ou por máquina de estados)
        InventoryManager::startScanFor(4000);
    }

    // 2. Scan terminou: processa a diferença e salva na Fila Offline
    if (InventoryManager::scanJustFinished())
    {
        auto eventos = InventoryManager::calculateDiff(); // Calcula os eventos

        if (!eventos.empty())
        {
            String jsonEventos = InventoryManager::serializeEvents(eventos); // Transforma em JSON
            StorageHandler::pushEventToQueue(jsonEventos.c_str());           // Empilha na fila (Flash)
            InventoryManager::commitInventory();                             // Atualiza o estado atual
        }
    }

    // 3. Sync com o Servidor: Despacha a fila de eventos
    if (WiFiHandler::isConnected() && StorageHandler::hasPendingEvents())
    {
        while (StorageHandler::hasPendingEvents())
        {
            String payload = StorageHandler::popEventFromQueue();
            if (MqttHandler::publish("equipamentos", "sync_events", payload.c_str()))
            {
                // Sucesso: remove da fila (já feito pelo pop)
            }
            else
            {
                // Falha no envio: coloca de volta na fila
                StorageHandler::pushEventToQueue(payload.c_str());
                break;
            }
        }
    }
}