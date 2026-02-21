import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const SonataNFT = await ethers.getContractFactory("SonataNFT");
  const sonata = await SonataNFT.deploy();
  await sonata.waitForDeployment();
  const sonataAddr = await sonata.getAddress();
  console.log("SonataNFT deployed to:", sonataAddr);

  const ProjectVault = await ethers.getContractFactory("ProjectVault");
  const vault = await ProjectVault.deploy(sonataAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("ProjectVault deployed to:", vaultAddr);

  console.log("\nSet these in your .env files:");
  console.log(`  SONATA_NFT_ADDRESS=${sonataAddr}`);
  console.log(`  PROJECT_VAULT_ADDRESS=${vaultAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
