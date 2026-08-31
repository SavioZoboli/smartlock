#include <Arduino.h>
#include "status_feedback_handler.h"
#include "wifi_handler.h"
#include "mqtt_handler.h"
#include "display_handler.h"
#include "rfid_hf_handler.h"
#include "reader_module.h"
#include "hardware_io_handler.h"
#include "auth_handler.h"
#include "buzzer_handler.h"
#include "inventory_manager.h"
#include "storage_handler.h"
#include "system.h"
#include "time_handler.h"


unsigned long timerLeitura = 0; 
const unsigned long TIMEOUT_LEITURA_MS = 45000; // 45 Segundos limite para o Slave responder


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
    ReaderModule::init();
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
    System::update();

    ReaderModule::update();

    if (System::getState() == SystemState::IDLE)
    {
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


    // USUÁRIO ESTÁ PEGANDO / DEVOLVENDO EQUIPAMENTOS
    if (System::getState() == SystemState::IN_PROCESS)
    {
        DisplayHandler::setFixedMessage("Feche a porta");
        if (HardwareIOHandler::doorJustClosed())
        {
            BuzzerHandler::play(SoundEffect::LOGOFF);
            DisplayHandler::setFixedMessage("Fazendo leitura");
            ReaderModule::beginReading();
            StatusFeedback::set(Component::PORTA, State::CLOSED);
            System::setState(SystemState::READING);
            
            timerLeitura = millis(); // INICIA O CRONÔMETRO DE SEGURANÇA
        }
    }

    // FAZENDO A LEITURA
    if (System::getState() == SystemState::READING)
    {
        // 1. Verifica se houve Timeout (Slave morreu ou cabo rompeu)
        if (millis() - timerLeitura > TIMEOUT_LEITURA_MS) {
            Serial.println("[ERRO CRÍTICO] Timeout! Slave não respondeu.");
            BuzzerHandler::play(SoundEffect::OP_FAIL);
            DisplayHandler::setTimeoutMessage("ERRO", "Leitor Falhou", 4000);
            System::setState(SystemState::IDLE);
        }
        // 2. Verifica se o Slave respondeu (com Sucesso ou Erro)
        else if (ReaderModule::scanJustFinished()) 
        {
            if (ReaderModule::wasSuccess()) {
                // SUCESSO: Faz o cálculo de diferença de inventário normalmente
                BuzzerHandler::play(SoundEffect::RFID_SUCCESS);
                ReaderModule::populateCurrentInventory(InventoryManager::inventarioAtual);
                auto eventos = InventoryManager::calculateDiff();

                if (!eventos.empty()) {
                    String jsonEventos = InventoryManager::serializeEvents(eventos);
                    StorageHandler::pushEventToQueue(jsonEventos.c_str());
                    InventoryManager::commitInventory();
                }
            } else {
                // ERRO MECÂNICO: Motor travou no meio. Descarta a leitura para não gerar falsas retiradas!
                BuzzerHandler::play(SoundEffect::OP_FAIL);
                DisplayHandler::setTimeoutMessage("ERRO", "Falha Mecanica", 4000);
            }
            
            System::setState(SystemState::IDLE);
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
