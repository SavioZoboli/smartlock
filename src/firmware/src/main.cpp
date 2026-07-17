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
#include "state_handler.h"

bool esperandoNuvem = false;

void setup()
{
    Serial.begin(115200);

    // Inicia a máquina de estados do sistema.
    StateHandler::init();

    // Inicia o feedback visual e sonoro
    StatusFeedback::init();
    BuzzerHandler::init();
    DisplayHandler::init();


    //Inicializa a fechadura
    HardwareIOHandler::init();

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

    // Finaliza a inicialização
    DisplayHandler::setFixedMessage("SMART LOCK", "Aproxime o\nCracha");

    StateHandler::setState(SystemState::IDLE);
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

    //  NOVO CRACHÁ DETECTADO E NÃO ESTAMOS ESPERANDO NADA
    if (StateHandler::getState() == SystemState::IDLE && RfidHfHandler::readTag(uidLida, sizeof(uidLida)))
    {
        Serial.print("UID Lida:");
        Serial.println(uidLida);
        AuthState status = AuthHandler::requestAccess(uidLida);
        BuzzerHandler::play(SoundEffect::TAG_READ);
        if (status == AuthState::GRANTED)
        {
            HardwareIOHandler::unlockDoor();
            BuzzerHandler::play(SoundEffect::OP_SUCCESS);
            StateHandler::setState(SystemState::IN_PROCESS);
            DisplayHandler::setTimeoutMessage("SUCESSO", "Autorizado", 5000);
        }
        else if (status == AuthState::DENIED || status == AuthState::ERROR_OFFLINE)
        {
            BuzzerHandler::play(SoundEffect::OP_FAIL);
            StateHandler::setState(SystemState::IDLE);
            DisplayHandler::setTimeoutMessage("NEGADO", "Negado", 3000);
        }
        else if (status == AuthState::PENDING_CLOUD)
        {
            StateHandler::setState(SystemState::AWAITING_CLOUD);
            DisplayHandler::setFixedMessage("AGUARDE...", "Validando\nNuvem");
        }
    }

    // ESTAMOS ESPERANDO A RESPOSTA DO WORKER CHEGAR
    if (StateHandler::getState() == SystemState::AWAITING_CLOUD)
    {
        AuthState asyncStatus = AuthHandler::getAsyncStatus();

        // Se a nuvem respondeu algo (Sucesso, Negado ou Timeout) sai do estado Pending
        if (asyncStatus != AuthState::PENDING_CLOUD)
        {
            
            // Restaura a tela padrão
            DisplayHandler::setFixedMessage("SMART LOCK", "Aproxime o\nCracha");
            Serial.print("Irá validar o acesso: ");
            if (asyncStatus == AuthState::GRANTED)
            {
                Serial.println("Acesso autorizado");
                HardwareIOHandler::unlockDoor();
                BuzzerHandler::play(SoundEffect::OP_SUCCESS);
                StateHandler::setState(SystemState::IN_PROCESS);
                DisplayHandler::setTimeoutMessage("SUCESSO", "Autorizado", 5000);
            }
            else if (asyncStatus == AuthState::DENIED)
            {
                Serial.println("Acesso negado");
                BuzzerHandler::play(SoundEffect::OP_FAIL);
                StateHandler::setState(SystemState::IDLE);
                DisplayHandler::setTimeoutMessage("NEGADO", "Negado", 3000);
            }
            else if (asyncStatus == AuthState::TIMEOUT_CLOUD)
            {
                Serial.println("Sem resposta");
                BuzzerHandler::play(SoundEffect::OP_FAIL);
                StateHandler::setState(SystemState::IDLE);
                DisplayHandler::setTimeoutMessage("FALHA REDE", "Sem Resposta", 3000);
            }
        }
    }
    
    if (HardwareIOHandler::doorJustClosed())
    {
        // Liga o leitor e espera terminar (bloqueante por 4s aqui ou por máquina de estados)
        InventoryManager::startScanFor(4000);
        StatusFeedback::set(Component::PORTA,State::CLOSED);
        StateHandler::setState(SystemState::READING);
    }


    if(StateHandler::getState() == SystemState::READING){
        StateHandler::setState(SystemState::IDLE);
    }

    // 2. Scan terminou: processa a diferença e salva na Fila Offline
    /*if (InventoryManager::scanJustFinished())
    {

        StateHandler::setState(SystemState::IDLE); 
        return;

        //Remover e validar quando tiver o leitor de RFID UHF
        auto eventos = InventoryManager::calculateDiff(); // Calcula os eventos

        if (!eventos.empty())
        {
            String jsonEventos = InventoryManager::serializeEvents(eventos); // Transforma em JSON
            StorageHandler::pushEventToQueue(jsonEventos.c_str());           // Empilha na fila (Flash)
            InventoryManager::commitInventory();   
            StateHandler::setState(SystemState::IDLE);                          // Atualiza o estado atual
        }
    }*/

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