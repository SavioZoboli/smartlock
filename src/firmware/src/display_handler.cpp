#include "display_handler.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "wifi_handler.h"
#include "mqtt_handler.h"
#include "hardware_io_handler.h"
#include "system.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

namespace
{
    // Instância do display
    Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

    // Variáveis de Estado da Interface
    bool _wifiOk = false;
    bool _mqttOk = false;
    bool _isLocked = true;

    // Buffers de texto (Evitando a classe String para proteger a RAM)
    char currentTitle[32] = "SISTEMA";
    char currentMessage[64] = "Iniciando...";
    char currentStatus[24] = "INICIANDO";

    // Buffers para o estado padrão (quando o timeout acaba)
    char defaultTitle[32] = "SMART LOCK";
    char defaultMessage[64] = "Aproxime o\nCracha";

    // Controle Assíncrono
    bool needsRedraw = true;
    bool isTimeoutActive = false;
    unsigned long timeoutEndMillis = 0;
}

void DisplayHandler::init()
{
    // Inicia a comunicação I2C
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    {
        Serial.println(F("Falha ao alocar SSD1306"));
        for (;;)
            ; // Trava aqui se o display estiver com defeito/desconectado
    }

    display.clearDisplay();
    display.display();
    display.setTextColor(SSD1306_WHITE);
    needsRedraw = true;
}

void DisplayHandler::setIndicators(bool wifiOk, bool mqttOk, bool isLocked)
{
    if (_wifiOk != wifiOk || _mqttOk != mqttOk || _isLocked != isLocked)
    {
        _wifiOk = wifiOk;
        _mqttOk = mqttOk;
        _isLocked = isLocked;
        needsRedraw = true; // Só redesenha se algo mudou
    }
}

void DisplayHandler::setFixedMessage(const char *message)
{

    String systemTitle = System::getSystemTitle();

    strncpy(defaultTitle, systemTitle.c_str(), sizeof(defaultTitle));
    defaultTitle[sizeof(defaultTitle) - 1] = '\0';
    strncpy(defaultMessage, message, sizeof(defaultMessage));
    defaultMessage[sizeof(defaultMessage) - 1] = '\0';

    if (!isTimeoutActive)
    {
        if (strcmp(currentTitle, defaultTitle) != 0 || strcmp(currentMessage, defaultMessage) != 0)
        {
            strncpy(currentTitle, defaultTitle, sizeof(currentTitle) - 1);
            currentTitle[sizeof(currentTitle) - 1] = '\0';
            strncpy(currentMessage, defaultMessage, sizeof(currentMessage) - 1);
            currentMessage[sizeof(currentMessage) - 1] = '\0';
            needsRedraw = true;
        }
    }
}

void DisplayHandler::setTimeoutMessage(const char *title, const char *message, unsigned long timeoutMs)
{
    strncpy(currentTitle, title, sizeof(currentTitle) - 1);
    currentTitle[sizeof(currentTitle) - 1] = '\0';
    strncpy(currentMessage, message, sizeof(currentMessage) - 1);
    currentMessage[sizeof(currentMessage) - 1] = '\0';

    isTimeoutActive = true;
    timeoutEndMillis = millis() + timeoutMs;
    needsRedraw = true;
}

void DisplayHandler::update()
{
    // Atualiza os status do sistema
    setIndicators(WiFiHandler::isConnected(), MqttHandler::isConnected(), !HardwareIOHandler::isDoorOpen());

    String stateStr = System::getStateString();
    if (strcmp(currentStatus, stateStr.c_str()) != 0)
    {
        strncpy(currentStatus, stateStr.c_str(), sizeof(currentStatus) - 1);
        currentStatus[sizeof(currentStatus) - 1] = '\0';
        needsRedraw = true;
    }

    // Verifica se o tempo da mensagem temporária acabou
    if (isTimeoutActive && millis() >= timeoutEndMillis)
    {
        isTimeoutActive = false;
        // Restaura a mensagem padrão
        strncpy(currentTitle, defaultTitle, sizeof(currentTitle));
        strncpy(currentMessage, defaultMessage, sizeof(currentMessage));
        needsRedraw = true;
    }

    // Só chama a rotina pesada do I2C se necessário
    if (needsRedraw)
    {
        drawLayout();
        needsRedraw = false;
    }
}

void DisplayHandler::drawLayout()
{
    display.clearDisplay();

    // ==========================================
    // 1. BARRA SUPERIOR (Status)
    // ==========================================
    display.setTextSize(1);
    display.setCursor(0, 0);

    // Indicador de Conexão
    display.print(_wifiOk ? "WFI:OK" : "WFI:--");
    display.print(" ");
    display.print(_mqttOk ? "MQT:OK" : "MQT:--");

    // Indicador de Trava (Alinhado à direita)
    display.setCursor(100, 0);
    display.print(_isLocked ? "LCK" : "OPN");

    // Linha divisória horizontal (Y = 10)
    display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);

    // ==========================================
    // 2. CORPO DA MENSAGEM
    // ==========================================
    // Título da Ação (Ex: "ACESSO NEGADO")
    display.setTextSize(1);
    display.setCursor(0, 14);
    display.println(currentTitle);

    // Mensagem principal
    display.setTextSize(1);
    display.setCursor(0, 33);
    display.println(currentMessage);

    // ==========================================
    // 3. BARRA INFERIOR (Status do Sistema - espelhada)
    // ==========================================
    display.drawLine(0, 53, SCREEN_WIDTH, 53, SSD1306_WHITE);
    display.setTextSize(1);
    int16_t statusX = (SCREEN_WIDTH - (static_cast<int16_t>(strlen(currentStatus)) * 6)) / 2;
    if (statusX < 0)
        statusX = 0;
    display.setCursor(statusX, 56);
    display.print(currentStatus);

    // Envia o buffer inteiro para a tela física de uma vez só
    display.display();
}