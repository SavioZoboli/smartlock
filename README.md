# 🔒 Smart Lock - Sistema de Controle e Inventário Inteligente

![Badge Hardware](https://img.shields.io/badge/Hardware-ESP32-blue)
![Badge Firmware](https://img.shields.io/badge/Firmware-PlatformIO-orange)
![Badge Protocol](https://img.shields.io/badge/Protocolo-MQTT-yellow)
![Badge Frontend](https://img.shields.io/badge/Frontend-Angular-red)
![Badge Backend](https://img.shields.io/badge/Backend-NodeJS-green)

## 📌 Escopo do Projeto

O **Smart Lock** é uma solução IoT desenvolvida para garantir o acesso seguro a armários e gaveteiros, aliada ao controle automatizado de inventário de equipamentos. O sistema substitui o controle manual (livros de protocolo) por uma trilha de auditoria digital e inviolável.

O grande diferencial do projeto é sua arquitetura **Offline-First**. O hardware local possui inteligência e armazenamento próprio, garantindo que a abertura de portas e o registro de movimentações de patrimônio ocorram perfeitamente mesmo em cenários de queda de rede (Wi-Fi/Internet). Assim que a conexão é restabelecida, o dispositivo sincroniza os dados pendentes de forma assíncrona com o servidor central.

## 🧩 Partes do Sistema

O projeto é dividido em quatro camadas principais:

1. **Camada Local (Firmware/Hardware):** Executada em microcontroladores ESP32, gerencia periféricos (Leitor RFID LF/UHF, Relé, Sensor de Porta, Display OLED e Buzzer). Processa regras locais de autenticação e armazena os dados na memória flash (LittleFS).
2. **Camada de Comunicação (Worker MQTT):** Responsável por toda a mensageria bidirecional e assíncrona entre o hardware e o servidor central.
3. **Camada Central (API):** Serviço backend responsável por receber solicitações HTTP, validar as regras de negócio de nível global, resolver conflitos de dados e persistir tudo no banco de dados.
4. **Camada de Gestão (HMI):** Interface web administrativa construída com Angular Material para o cadastro de funcionários, smartlocks, equipamentos e visualização de dashboards de status.

## 📂 Estrutura do Repositório

O repositório está organizado no formato de *monorepo*, separando claramente cada camada da aplicação:

    📦 smartlock-project
     ┣ 📂 firmware/              
     ┃ ┣ 📂 src/                  
     ┃ ┣ 📂 include/              
     ┃ ┗ 📜 platformio.ini        
     ┣ 📂 api/                
     ┃ ┣ 📂 src/
     ┃ ┗ 📜 package.json                   
     ┣ 📂 worker-mqtt/          
     ┃ ┣ 📂 src/
     ┃ ┗ 📜 package.json    
     ┣ 📂 frontend/               
     ┃ ┣ 📂 src/app/              
     ┃ ┗ 📜 package.json          
     ┗ 📂 docs/                   
       ┣ 📂 diagramas/            
       ┗ 📜 Documentação do projeto

---
*Projeto desenvolvido para otimização da gestão de ativos institucionais utilizando tecnologia e inovação.*
