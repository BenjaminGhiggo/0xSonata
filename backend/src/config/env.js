require("dotenv").config();

const config = {
  port: process.env.PORT || 4000,
  rpcUrl: process.env.RPC_URL || "https://rpc-pob.dev11.top",
  sonetyoAddress: process.env.SONETYO_NFT_ADDRESS || "",
  projectVaultAddress: process.env.PROJECT_VAULT_ADDRESS || "",
  dbClient: process.env.DB_CLIENT || "sqlite3", // "pg" en producción
  dbUrl: process.env.DATABASE_URL || "./dev.db",
};

module.exports = config;

