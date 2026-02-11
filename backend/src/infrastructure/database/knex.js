const knexLib = require("knex");
const config = require("../../config/env");

let knex;

function getKnex() {
  if (!knex) {
    const client = config.dbClient;

    const connection =
      client === "sqlite3"
        ? {
            filename: config.dbUrl,
          }
        : config.dbUrl;

    knex = knexLib({
      client,
      connection,
      useNullAsDefault: client === "sqlite3",
    });
  }

  return knex;
}

async function initDb() {
  const db = getKnex();

  // Crear tabla projects si no existe
  const exists = await db.schema.hasTable("projects");
  if (!exists) {
    await db.schema.createTable("projects", (table) => {
      table.increments("id").primary();
      table.integer("vault_id").nullable();
      table.string("creator_address").notNullable().index();
      table.json("idea_token_ids").notNullable();
      table.string("title").notNullable();
      table.text("description").notNullable();
      table.string("cover_url").nullable();
      table.string("metadata_uri").nullable();
      table.timestamp("created_at").defaultTo(db.fn.now());
      table.timestamp("updated_at").defaultTo(db.fn.now());
    });
  }
}

module.exports = {
  getKnex,
  initDb,
};

