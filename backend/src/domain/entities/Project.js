class Project {
  constructor({
    id = null,
    vaultId = null,
    creatorAddress,
    ideaTokenIds,
    title,
    description,
    coverUrl = null,
    metadataURI = null,
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id;
    this.vaultId = vaultId;
    this.creatorAddress = creatorAddress;
    this.ideaTokenIds = ideaTokenIds;
    this.title = title;
    this.description = description;
    this.coverUrl = coverUrl;
    this.metadataURI = metadataURI;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Project;

