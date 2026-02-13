const { ethers } = require("ethers");
const config = require("../../config/env");

// ABI mínimo necesario para lecturas desde SonetyoNFT
const SONETYO_ABI = [
  "function totalSupply() view returns (uint256)",
  "function getCreatorStats(address creator) view returns (uint256 totalMints, uint256 totalVerificationsGiven)",
  "function getProof(uint256 tokenId) view returns (tuple(bytes32 audioHash,uint256 timestamp,address creator,uint256 verificationCount))",
];

// ABI mínimo para ProjectVault
const PROJECT_VAULT_ABI = [
  "function getVault(uint256 vaultId) view returns (tuple(uint256[] ideaTokenIds,address creator))",
  "function getVaultIdeas(uint256 vaultId) view returns (uint256[])",
];

function getProvider() {
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

function getSonetyoContract() {
  if (!config.sonetyoAddress) {
    throw new Error("SONETYO_NFT_ADDRESS no configurado");
  }
  return new ethers.Contract(config.sonetyoAddress, SONETYO_ABI, getProvider());
}

function getProjectVaultContract() {
  if (!config.projectVaultAddress) {
    throw new Error("PROJECT_VAULT_ADDRESS no configurado");
  }
  return new ethers.Contract(config.projectVaultAddress, PROJECT_VAULT_ABI, getProvider());
}

async function getCreatorStats(address) {
  const contract = getSonetyoContract();
  const [totalMints, totalVerificationsGiven] = await contract.getCreatorStats(address);
  return {
    totalMints: Number(totalMints),
    totalVerificationsGiven: Number(totalVerificationsGiven),
  };
}

async function getProof(tokenId) {
  const contract = getSonetyoContract();
  const proof = await contract.getProof(tokenId);
  return {
    audioHash: proof.audioHash,
    timestamp: Number(proof.timestamp),
    creator: proof.creator,
    verificationCount: Number(proof.verificationCount),
  };
}

async function getIdeasByCreator(address) {
  const contract = getSonetyoContract();
  const total = await contract.totalSupply();
  const totalNumber = Number(total);

  const ideas = [];

  for (let tokenId = 0; tokenId < totalNumber; tokenId += 1) {
    const proof = await contract.getProof(tokenId);
    if (proof.creator.toLowerCase() === address.toLowerCase()) {
      ideas.push({
        tokenId,
        audioHash: proof.audioHash,
        timestamp: Number(proof.timestamp),
        creator: proof.creator,
        verificationCount: Number(proof.verificationCount),
      });
    }
  }

  return ideas;
}

async function getVault(vaultId) {
  const contract = getProjectVaultContract();
  const vault = await contract.getVault(vaultId);
  const ideas = await contract.getVaultIdeas(vaultId);
  return {
    ideaTokenIds: ideas.map((n) => Number(n)),
    creator: vault.creator,
  };
}

module.exports = {
  getCreatorStats,
  getProof,
  getIdeasByCreator,
  getVault,
};

