const { getKnex } = require("../database/knex");
const Project = require("../../domain/entities/Project");

class ProjectRepositorySql {
  constructor() {
    this.db = getKnex();
  }

  async create({ creatorAddress, ideaTokenIds, title, description, coverUrl, metadataURI }) {
    const now = new Date().toISOString();
    const [id] = await this.db("projects").insert(
      {
        creator_address: creatorAddress,
        idea_token_ids: JSON.stringify(ideaTokenIds),
        title,
        description,
        cover_url: coverUrl,
        metadata_uri: metadataURI,
        created_at: now,
        updated_at: now,
      },
      ["id"],
    );

    const insertedId = typeof id === "object" && id.id ? id.id : id;

    return new Project({
      id: insertedId,
      creatorAddress,
      ideaTokenIds,
      title,
      description,
      coverUrl,
      metadataURI,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findByCreatorAddress(creatorAddress) {
    const rows = await this.db("projects").where({ creator_address: creatorAddress }).orderBy("created_at", "desc");
    return rows.map(
      (row) =>
        new Project({
          id: row.id,
          vaultId: row.vault_id,
          creatorAddress: row.creator_address,
          ideaTokenIds: JSON.parse(row.idea_token_ids),
          title: row.title,
          description: row.description,
          coverUrl: row.cover_url,
          metadataURI: row.metadata_uri,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }),
    );
  }
}

const projectRepository = new ProjectRepositorySql();

module.exports = {
  ProjectRepositorySql,
  projectRepository,
};

