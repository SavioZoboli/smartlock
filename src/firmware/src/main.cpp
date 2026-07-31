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
#include "system.h"
#include "time_handler.h"

void setup()
{
    Serial.begin(115200);

    // 1. Inicializa o hardware físico PRIMEIRO
    StatusFeedback::init();
    BuzzerHandler::init();
    DisplayHandler::init();
    HardwareIOHandler::init();
    delay(500);
    // Feedback inicial seguro
    DisplayHandler::setIndicators(false, false, false);
    DisplayHandler::setFixedMessage("Inicializando");
    DisplayHandler::update();
    delay(500);

    // 2. Inicializa as comunicações de rede
    WiFiHandler::init();
    delay(500);
    Time::init();
    delay(500);
    MqttHandler::init();

    // 3. Inicializa os periféricos de leitura
    RfidHfHandler::init();
    UhfHandler::init();
    AuthHandler::init();
    StorageHandler::init();

    // 4. Inicializa o cérebro do sistema POR ÚLTIMO
    // Agora, se ele não achar a configuração e chamar o iniciarProvisionamento(),
    // a tela OLED já existe, o WiFi já está pronto para pegar o MAC, e o MQTT já nasceu.
    System::init();
}

void autorizaAcesso()
{
    Serial.println("Acesso autorizado");
    HardwareIOHandler::unlockDoor();
    BuzzerHandler::play(SoundEffect::OP_SUCCESS);
    System::setState(SystemState::IN_PROCESS);
    DisplayHandler::setTimeoutMessage("SUCESSO", "Autorizado", 5000);
}

void rejeitaAcesso()
{
    Serial.println("Acesso negado");
    BuzzerHandler::play(SoundEffect::OP_FAIL);
    System::setState(SystemState::IDLE);
}

void semResposta()
{
    Serial.println("Sem resposta");
    BuzzerHandler::play(SoundEffect::OP_FAIL);
    System::setState(SystemState::IDLE);
    DisplayHandler::setTimeoutMessage("FALHA REDE", "Sem Resposta", 3000);
}

void loop()
{
    
    WiFiHandler::update();
    Time::update();
    MqttHandler::update();
    StatusFeedback::update();
    
    if(System::getState()==SystemState::IDLE){
        DisplayHandler::setFixedMessage("Aproxime o cracha...");
    }


    DisplayHandler::update();

    if (System::getState() == SystemState::PROVISIONANDO && WiFiHandler::isConnected() && MqttHandler::isConnected())
    {

        System::updateProvisionamento();
        return;
    }

    // 1. Atualiza as rotinas de background
    HardwareIOHandler::update();
    AuthHandler::update();

    InventoryManager::update();

    char uidLida[16] = {0};

    //  NOVO CRACHÁ DETECTADO E NÃO ESTAMOS ESPERANDO NADA
    if (System::getState() == SystemState::IDLE && RfidHfHandler::readTag(uidLida, sizeof(uidLida)))
    {
        Serial.print("UID Lida:");
        Serial.println(uidLida);
        AuthState status = AuthHandler::requestAccess(uidLida);
        BuzzerHandler::play(SoundEffect::TAG_READ);
        if (status == AuthState::GRANTED)
        {
            autorizaAcesso();
        }
        else if (status == AuthState::DENIED || status == AuthState::ERROR_OFFLINE)
        {
            rejeitaAcesso();
        }
        else if (status == AuthState::PENDING_CLOUD)
        {
            System::setState(SystemState::AWAITING_CLOUD);
            DisplayHandler::setFixedMessage("Validando\nNuvem");
        }
    }

    // ESTAMOS ESPERANDO A RESPOSTA DO WORKER CHEGAR
    if (System::getState() == SystemState::AWAITING_CLOUD)
    {
        AuthState asyncStatus = AuthHandler::getAsyncStatus();

        // Se a nuvem respondeu algo (Sucesso, Negado ou Timeout) sai do estado Pending
        if (asyncStatus != AuthState::PENDING_CLOUD)
        {

            // Restaura a tela padrão
            DisplayHandler::setFixedMessage("Aproxime o Cracha");
            if (asyncStatus == AuthState::GRANTED)
            {
                autorizaAcesso();
            }
            else if (asyncStatus == AuthState::DENIED)
            {
                rejeitaAcesso();
            }
            else if (asyncStatus == AuthState::TIMEOUT_CLOUD)
            {
                semResposta();
            }
        }
    }

    if (System::getState() == SystemState::IN_PROCESS)
    {
        DisplayHandler::setFixedMessage("Feche a porta");
        if (HardwareIOHandler::doorJustClosed())
        {
            // Liga o leitor e espera terminar (bloqueante por 4s aqui ou por máquina de estados)
            BuzzerHandler::play(SoundEffect::LOGOFF);
            DisplayHandler::setTimeoutMessage("INVENTARIO", "Fazendo leitura", 4000);
            InventoryManager::startScanFor(4000);
            StatusFeedback::set(Component::PORTA, State::CLOSED);
            System::setState(SystemState::READING);
        }
    }

    if (System::getState() == SystemState::READING && InventoryManager::scanJustFinished())
    {

        System::setState(SystemState::IDLE);
        BuzzerHandler::play(SoundEffect::RFID_SUCCESS);
        return;

        // Remover e validar quando tiver o leitor de RFID UHF
        auto eventos = InventoryManager::calculateDiff(); // Calcula os eventos

        if (!eventos.empty())
        {
            String jsonEventos = InventoryManager::serializeEvents(eventos); // Transforma em JSON
            StorageHandler::pushEventToQueue(jsonEventos.c_str());           // Empilha na fila (Flash)
            InventoryManager::commitInventory();
            System::setState(SystemState::IDLE); // Atualiza o estado atual
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
