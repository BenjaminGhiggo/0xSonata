import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();


  const SonataNFT = await ethers.getContractFactory("SonataNFT");
  const sonata = await SonataNFT.deploy();
  await sonata.waitForDeployment();
  const sonataAddr = await sonata.getAddress();


  const ProjectVault = await ethers.getContractFactory("ProjectVault");
  const vault = await ProjectVault.deploy(sonataAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
