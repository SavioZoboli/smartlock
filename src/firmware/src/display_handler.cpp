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
    char currentTitle[64] = "SISTEMA";
    char currentMessage[64] = "Iniciando...";
    char currentStatus[24] = "INICIANDO";

    // Buffers para o estado padrão (quando o timeout acaba)
    char defaultTitle[64] = "SMART LOCK";
    char defaultMessage[64] = "Aproxime o\nCracha";

    constexpr uint8_t MAX_CHARS_PER_LINE = 21; // 128px / 6px por caractere (textSize 1)
    constexpr int16_t LINE_HEIGHT_PX = 8;

    /**
     * Quebra o texto em linhas respeitando '\n' e limites de palavra (espaços),
     * sem cortar palavras ao meio. Se `draw == true`, desenha a partir de `startY`.
     * Retorna a quantidade de linhas usadas (limitada a `maxLines`).
     */
    int renderWrappedLines(const char *text, int16_t startY, int maxLines, bool draw)
    {
        if (!text || maxLines <= 0)
            return 0;

        int linesUsed = 0;
        const char *p = text;

        while (*p != '\0' && linesUsed < maxLines)
        {
            while (*p == ' ')
                p++;
            if (*p == '\0')
                break;

            // Encontra o fim do segmento até '\n' ou '\0'
            const char *segEnd = p;
            while (*segEnd != '\0' && *segEnd != '\n')
                segEnd++;

            size_t segLen = static_cast<size_t>(segEnd - p);
            size_t takeLen = segLen;

            if (takeLen > MAX_CHARS_PER_LINE)
            {
                // Procura último espaço dentro do limite de 21 caracteres
                size_t breakPos = MAX_CHARS_PER_LINE;
                while (breakPos > 0 && p[breakPos] != ' ')
                    breakPos--;

                takeLen = (breakPos > 0) ? breakPos : MAX_CHARS_PER_LINE;
            }

            // Copia a linha com reticências se for a última linha permitida e ainda sobrar texto
            char lineBuf[MAX_CHARS_PER_LINE + 1];
            const char *nextP = p + takeLen;
            while (*nextP == ' ')
                nextP++;

            bool truncated = (linesUsed == maxLines - 1) && (*nextP != '\0');
            if (truncated && takeLen > MAX_CHARS_PER_LINE - 3)
            {
                takeLen = MAX_CHARS_PER_LINE - 3;
            }

            memcpy(lineBuf, p, takeLen);
            if (truncated)
            {
                memcpy(lineBuf + takeLen, "...", 3);
                lineBuf[takeLen + 3] = '\0';
            }
            else
            {
                lineBuf[takeLen] = '\0';
            }

            if (draw)
            {
                display.setCursor(0, startY + (linesUsed * LINE_HEIGHT_PX));
                display.print(lineBuf);
            }

            linesUsed++;

            if (p + takeLen == segEnd && *segEnd == '\n')
            {
                p = segEnd + 1;
            }
            else
            {
                p = nextP;
            }
        }

        return linesUsed;
    }

    // Controle Assíncrono
    bool displayAvailable = false;
    bool needsRedraw = true;
    bool isTimeoutActive = false;
    unsigned long timeoutStartMillis = 0;
    unsigned long timeoutDurationMillis = 0;
}

void DisplayHandler::init()
{
    // Inicia a comunicação I2C (degrada para modo headless se o OLED falhar)
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    {
        Serial.println(F("[DISPLAY] Falha ao iniciar SSD1306. Operando em modo headless."));
        displayAvailable = false;
        return;
    }

    displayAvailable = true;
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
    timeoutStartMillis = millis();
    timeoutDurationMillis = timeoutMs;
    needsRedraw = true;
}

void DisplayHandler::update()
{
    if (!displayAvailable)
    {
        return;
    }

    // Atualiza os status do sistema
    setIndicators(WiFiHandler::isConnected(), MqttHandler::isConnected(), !HardwareIOHandler::isDoorOpen());

    String stateStr = System::getStateString();
    if (strcmp(currentStatus, stateStr.c_str()) != 0)
    {
        strncpy(currentStatus, stateStr.c_str(), sizeof(currentStatus) - 1);
        currentStatus[sizeof(currentStatus) - 1] = '\0';
        needsRedraw = true;
    }

    // Verifica se o tempo da mensagem temporária acabou (seguro contra rollover de millis())
    if (isTimeoutActive && (millis() - timeoutStartMillis >= timeoutDurationMillis))
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
    // 2. CORPO DA MENSAGEM (quebra por palavra + posicionamento dinâmico)
    // ==========================================
    display.setTextSize(1);
    display.setTextWrap(false);

    // Área útil vertical: Y = 13 até Y = 51 (39px = até 4 linhas + respiro)
    constexpr int16_t BODY_TOP_Y = 13;
    constexpr int16_t BODY_BOTTOM_Y = 51;

    int msgLinesNeeded = renderWrappedLines(currentMessage, 0, 2, false);
    if (msgLinesNeeded < 1)
        msgLinesNeeded = 1;

    // Se a mensagem tem 1 linha, o título pode ocupar até 3 linhas; se tem 2, até 2 linhas
    int maxTitleLines = (msgLinesNeeded >= 2) ? 2 : 3;
    int titleLinesUsed = renderWrappedLines(currentTitle, BODY_TOP_Y, maxTitleLines, true);

    int16_t msgY = BODY_TOP_Y + (titleLinesUsed * LINE_HEIGHT_PX) + 3;
    int16_t maxMsgY = BODY_BOTTOM_Y - (msgLinesNeeded * LINE_HEIGHT_PX);
    if (msgY > maxMsgY)
        msgY = maxMsgY;
    if (msgY < BODY_TOP_Y)
        msgY = BODY_TOP_Y;

    renderWrappedLines(currentMessage, msgY, msgLinesNeeded, true);
    display.setTextWrap(true);

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