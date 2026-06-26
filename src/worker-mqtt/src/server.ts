import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


// Importação do cliente MQTT
require('./config/mqtt');

// Garante o carregamento das variáveis de ambiente
dotenv.config();


