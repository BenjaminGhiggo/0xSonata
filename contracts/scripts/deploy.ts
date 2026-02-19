import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SonataNFT with account:", deployer.address);

  const SonataNFT = await ethers.getContractFactory("SonataNFT");
  const sonata = await SonataNFT.deploy();
  await sonata.waitForDeployment();

  const address = await sonata.getAddress();
  console.log("SonataNFT deployed to:", address);
  console.log("\nSet this in your .env files:");
  console.log(`  SONATA_NFT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
