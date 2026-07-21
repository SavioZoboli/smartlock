//Imports
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';

// Garante o carregamento das variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Porta 14000 é a HMI
// Porta 14003 será o Worker MQTT

app.use(cors({
  origin: ['http://localhost:4200','http://189.8.205.50:14000','http://189.8.205.50:14003'], 
  credentials: true,
}));
app.use(express.json());

app.use(cookieParser());

// Middleware que intercepta todas as requisições
app.use((req, res, next) => {
    // Exibe no terminal: "GET /usuarios"
    console.log(`${req.method} ${req.url}`);
    next(); // Passa para a próxima etapa (a rota real)
});

// Rota HTTP simples apenas para teste de sanidade da API
app.get("/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date(),
    sistema: "SmartLock API Node.js",
  });
});

const indexRoutes = require("./routes/index.routes")
app.use("/api",indexRoutes)

// Liga o servidor HTTP Express
app.listen(PORT, () => {
  console.log(`[SISTEMA] Servidor HTTP operacional na porta ${PORT}`);
  console.log(
    `[SISTEMA] Teste de status disponível em: http://localhost:${PORT}/status`,
  );
  console.log(
    "-------------------------------------------------------------\n",
  );
});
