# 🔒 Smart Lock - Sistema de Controle e Inventário Inteligente

![Badge Hardware](https://img.shields.io/badge/Hardware-ESP32-blue)
![Badge Firmware](https://img.shields.io/badge/Firmware-PlatformIO-orange)
![Badge Protocol](https://img.shields.io/badge/Protocolo-MQTT-yellow)
![Badge Frontend](https://img.shields.io/badge/Frontend-Angular-red)

## 📌 Escopo do Projeto

O **Smart Lock** é uma solução IoT desenvolvida para garantir o acesso seguro a armários e gaveteiros, aliada ao controle automatizado de inventário de equipamentos. O sistema substitui o controle manual (livros de protocolo) por uma trilha de auditoria digital e inviolável.

O grande diferencial do projeto é sua arquitetura **Offline-First**. O hardware local possui inteligência e armazenamento próprio, garantindo que a abertura de portas e o registro de movimentações de patrimônio ocorram perfeitamente mesmo em cenários de queda de rede (Wi-Fi/Internet). Assim que a conexão é restabelecida, o dispositivo sincroniza os dados pendentes de forma assíncrona com o servidor central.

## 🧩 Partes do Sistema

O projeto é dividido em quatro camadas principais:

1. **Camada Local (Firmware/Hardware):** Executada em microcontroladores ESP32, gerencia periféricos (Leitor RFID LF/UHF, Relé, Sensor de Porta, Display OLED e Buzzer). Processa regras locais de autenticação e armazena os dados na memória flash (LittleFS).
2. **Camada de Comunicação (Broker MQTT):** Responsável por toda a mensageria bidirecional e assíncrona entre o hardware e o servidor central.
3. **Camada Central (API / Worker):** Serviço backend responsável por assinar (subscribe) os tópicos MQTT, validar as regras de negócio de nível global, resolver conflitos de dados e persistir tudo no banco de dados.
4. **Camada de Gestão (HMI):** Interface web administrativa construída com Angular Material para o cadastro de funcionários, smartlocks, equipamentos e visualização de dashboards de status.

## 📂 Estrutura do Repositório

O repositório está organizado no formato de *monorepo*, separando claramente cada camada da aplicação:

    📦 smartlock-project
     ┣ 📂 firmware/               # Código-fonte do hardware (ESP32)
     ┃ ┣ 📂 src/                  # Arquivos C++ (.cpp) do projeto principal
     ┃ ┣ 📂 include/              # Arquivos de cabeçalho (.h)
     ┃ ┗ 📜 platformio.ini        # Configurações de dependências e build do PlatformIO
     ┣ 📂 backend/                # Lógica da nuvem e processamento de dados
     ┃ ┣ 📂 api/                  # Endpoints REST e sincronização com sistemas legados (ex: GEPES)
     ┃ ┣ 📂 worker-mqtt/          # Script que escuta o broker e salva dados no banco
     ┃ ┗ 📜 docker-compose.yml    # Infraestrutura local (Broker MQTT + PostgreSQL)
     ┣ 📂 frontend/               # Código-fonte da Interface Web (HMI)
     ┃ ┣ 📂 src/app/              # Componentes Angular e Angular Material
     ┃ ┗ 📜 package.json          # Dependências do frontend
     ┗ 📂 docs/                   # Documentação técnica e modelagem
       ┣ 📂 diagramas/            # Diagramas de Atividades UML, C4 Model e Máquina de Estados
       ┗ 📜 requisitos.md         # Documento oficial de Requisitos Funcionais e Regras de Negócio

## 🚀 Como Encontrar e Navegar

- **Para desenvolvedores de Hardware:** Acesse a pasta `/firmware`. Você precisará da extensão do PlatformIO no VSCode para compilar e gravar o código no ESP32.
- **Para desenvolvedores Web:** Acesse a pasta `/frontend` para a interface gráfica e `/backend/api` para os endpoints HTTP.
- **Para engenharia de dados:** A lógica de inventário e resolução de conflitos offline encontra-se em `/backend/worker-mqtt`.
- **Para arquitetura e visão geral:** Consulte os PDFs e imagens na pasta `/docs`.

---
*Projeto desenvolvido para otimização da gestão de ativos institucionais utilizando tecnologia e inovação.*
