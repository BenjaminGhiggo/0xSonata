const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // 1) SonetyoNFT (prueba de ideas)
  const SonetyoNFT = await hre.ethers.getContractFactory("SonetyoNFT");
  const sonetyo = await SonetyoNFT.deploy();
  await sonetyo.waitForDeployment();
  const sonetyoAddress = await sonetyo.getAddress();
  console.log("✅ SonetyoNFT desplegado en:", sonetyoAddress);

  // 2) CreatorToken de ejemplo (podría hacerse vía factory más adelante)
  const CreatorToken = await hre.ethers.getContractFactory("CreatorToken");
  const creatorToken = await CreatorToken.deploy(
    "Creator Token - Demo",
    "CRT-DEMO",
    deployer.address,
    hre.ethers.parseEther("1000")
  );
  await creatorToken.waitForDeployment();
  const creatorTokenAddress = await creatorToken.getAddress();
  console.log("✅ CreatorToken de ejemplo desplegado en:", creatorTokenAddress);

  // 3) ProjectVault (apunta al contrato SonetyoNFT)
  const ProjectVault = await hre.ethers.getContractFactory("ProjectVault");
  const vault = await ProjectVault.deploy(sonetyoAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ ProjectVault desplegado en:", vaultAddress);

  console.log("\n🔗 Direcciones para frontend / backend:");
  console.log("   SONETYO_NFT_ADDRESS=", sonetyoAddress);
  console.log("   CREATOR_TOKEN_DEMO_ADDRESS=", creatorTokenAddress);
  console.log("   PROJECT_VAULT_ADDRESS=", vaultAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

