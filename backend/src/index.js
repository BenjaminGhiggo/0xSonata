const express = require("express");
const cors = require("cors");
const config = require("./config/env");
const routes = require("./interfaces/http/routes");
const { initDb } = require("./infrastructure/database/knex");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

initDb()
  .then(() => {
    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(
        `0xSonata backend escuchando en http://localhost:${config.port} (RPC: ${config.rpcUrl}, DB: ${config.dbClient})`,
      );
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Error inicializando la base de datos:", err);
    process.exit(1);
  });

