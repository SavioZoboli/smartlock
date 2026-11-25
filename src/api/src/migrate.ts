import fs from "fs";
import path from "path";
import * as SequelizeLib from "sequelize";
import sequelize from "./config/database";

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "migrations");
const MAX_TENTATIVAS_CONEXAO = 5;
const INTERVALO_RETRY_MS = 3000;

async function conectarComRetry(): Promise<void> {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_CONEXAO; tentativa++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      if (tentativa === MAX_TENTATIVAS_CONEXAO) {
        throw err;
      }
      console.warn(
        `[MIGRATIONS] Aguardando banco de dados (tentativa ${tentativa}/${MAX_TENTATIVAS_CONEXAO})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, INTERVALO_RETRY_MS));
    }
  }
}

async function executarMigrations(): Promise<void> {
  await conectarComRetry();

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
      "name" VARCHAR(255) NOT NULL PRIMARY KEY
    );
  `);

  const [rows] = (await sequelize.query(
    `SELECT "name" FROM "SequelizeMeta";`,
  )) as [{ name: string }[], unknown];

  const executadas = new Set(rows.map((r) => r.name));

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log(`[MIGRATIONS] Pasta ${MIGRATIONS_DIR} não encontrada. Nada a executar.`);
    return;
  }

  const arquivos = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((arquivo) => arquivo.endsWith(".js"))
    .sort();

  const pendentes = arquivos.filter((arquivo) => !executadas.has(arquivo));

  if (pendentes.length === 0) {
    console.log("[MIGRATIONS] Nenhuma migration pendente.");
    return;
  }

  console.log(`[MIGRATIONS] ${pendentes.length} migration(s) pendente(s) encontrada(s).`);

  const queryInterface = sequelize.getQueryInterface();

  for (const arquivo of pendentes) {
    const caminho = path.join(MIGRATIONS_DIR, arquivo);
    console.log(`[MIGRATIONS] Executando: ${arquivo}`);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const migration = require(caminho);
    if (typeof migration?.up !== "function") {
      throw new Error(`Migration ${arquivo} não exporta a função up()`);
    }

    await migration.up(queryInterface, SequelizeLib);

    await sequelize.query(`INSERT INTO "SequelizeMeta" ("name") VALUES (:name);`, {
      replacements: { name: arquivo },
    });

    console.log(`[MIGRATIONS] Concluída: ${arquivo}`);
  }

  console.log("[MIGRATIONS] Todas as migrations pendentes foram aplicadas com sucesso.");
}

executarMigrations()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[MIGRATIONS] Erro ao executar migrations:", err);
    try {
      await sequelize.close();
    } catch {
      // ignora erro ao fechar conexão falha
    }
    process.exit(1);
  });
