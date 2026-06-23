import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Garante o carregamento das variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais para o caso de você criar um painel web (Frontend) futuramente
app.use(cors());
app.use(express.json());

// Rota HTTP simples apenas para teste de sanidade da API
app.get("/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date(),
    sistema: "SmartLock API Node.js",
  });
});

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
