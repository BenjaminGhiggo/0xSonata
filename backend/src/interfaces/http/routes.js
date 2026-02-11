const express = require("express");
const { getCreatorStats, getProof, getVault } = require("../../infrastructure/blockchain/syscoin-adapter");
const { projectRepository } = require("../../infrastructure/repositories/ProjectRepositorySql");

const router = express.Router();

// Ping básico
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sonetyo-backend" });
});

// Stats de un artista (creador)
router.get("/artists/:address/stats", async (req, res) => {
  try {
    const { address } = req.params;
    const stats = await getCreatorStats(address);
    res.json({ address, ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de proyectos de un artista (desde DB)
router.get("/artists/:address/projects", async (req, res) => {
  try {
    const { address } = req.params;
    const projects = await projectRepository.findByCreatorAddress(address);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalle de una idea (Sonetyo Proof)
router.get("/ideas/:tokenId", async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (Number.isNaN(tokenId)) {
      return res.status(400).json({ error: "tokenId invalido" });
    }
    const proof = await getProof(tokenId);
    res.json({ tokenId, ...proof });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalle de un proyecto (Vault on-chain)
router.get("/projects/:vaultId", async (req, res) => {
  try {
    const vaultId = parseInt(req.params.vaultId, 10);
    if (Number.isNaN(vaultId)) {
      return res.status(400).json({ error: "vaultId invalido" });
    }
    const vault = await getVault(vaultId);
    res.json({ vaultId, ...vault });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear proyecto (persistencia off-chain)
router.post("/projects", async (req, res) => {
  try {
    const { ideaTokenIds, metadata, creatorAddress } = req.body;

    if (!Array.isArray(ideaTokenIds) || ideaTokenIds.length === 0) {
      return res.status(400).json({ error: "ideaTokenIds requerido" });
    }
    if (!metadata || !metadata.title || !metadata.description) {
      return res.status(400).json({ error: "metadata invalida" });
    }
    if (!creatorAddress) {
      return res.status(400).json({ error: "creatorAddress requerido" });
    }

    // Aquí en una fase siguiente se podría validar contra la chain e integrar IPFS.
    const project = await projectRepository.create({
      creatorAddress,
      ideaTokenIds,
      title: metadata.title,
      description: metadata.description,
      coverUrl: metadata.coverUrl || null,
      metadataURI: null, // pendiente de IPFS
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

