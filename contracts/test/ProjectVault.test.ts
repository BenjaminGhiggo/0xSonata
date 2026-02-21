import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ProjectVault", function () {
  const SAMPLE_HASH = ethers.id("test-audio");
  const SAMPLE_HASH_2 = ethers.id("test-audio-2");
  const SAMPLE_URI = "ipfs://QmTest";

  async function deployVaultFixture() {
    const [owner, artist, collaborator, funder] = await ethers.getSigners();

    const SonataNFT = await ethers.getContractFactory("SonataNFT");
    const sonata = await SonataNFT.deploy();
    const sonataAddr = await sonata.getAddress();

    const ProjectVault = await ethers.getContractFactory("ProjectVault");
    const vault = await ProjectVault.deploy(sonataAddr);

    return { sonata, vault, owner, artist, collaborator, funder };
  }

  async function mintedVaultFixture() {
    const base = await deployVaultFixture();
    await base.sonata.connect(base.artist).mint(SAMPLE_HASH, SAMPLE_URI);
    await base.sonata.connect(base.artist).mint(SAMPLE_HASH_2, "ipfs://2");
    return base;
  }

  describe("Create Vault", function () {
    it("should create vault with single collaborator (100%)", async function () {
      const { vault, artist } = await loadFixture(mintedVaultFixture);

      await vault.connect(artist).createVault(
        [0],
        [artist.address],
        [10000],
        "ipfs://project-meta"
      );

      expect(await vault.totalVaults()).to.equal(1);
    });

    it("should create vault with multiple collaborators and splits", async function () {
      const { vault, artist, collaborator } = await loadFixture(mintedVaultFixture);

      await vault.connect(artist).createVault(
        [0, 1],
        [artist.address, collaborator.address],
        [6000, 4000],
        "ipfs://collab-project"
      );

      const [id, creator, ideaIds, collabs, splits, uri, received, createdAt] =
        await vault.getVault(0);

      expect(creator).to.equal(artist.address);
      expect(ideaIds.length).to.equal(2);
      expect(collabs[0]).to.equal(artist.address);
      expect(collabs[1]).to.equal(collaborator.address);
      expect(splits[0]).to.equal(6000);
      expect(splits[1]).to.equal(4000);
    });

    it("should emit VaultCreated event", async function () {
      const { vault, artist } = await loadFixture(mintedVaultFixture);

      await expect(
        vault.connect(artist).createVault([0], [artist.address], [10000], "ipfs://meta")
      ).to.emit(vault, "VaultCreated");
    });

    it("should reject empty idea list", async function () {
      const { vault, artist } = await loadFixture(mintedVaultFixture);
      await expect(
        vault.connect(artist).createVault([], [artist.address], [10000], "ipfs://meta")
      ).to.be.revertedWith("Debe incluir al menos una idea");
    });

    it("should reject splits that don't sum to 100%", async function () {
      const { vault, artist } = await loadFixture(mintedVaultFixture);
      await expect(
        vault.connect(artist).createVault([0], [artist.address], [5000], "ipfs://meta")
      ).to.be.revertedWith("Los splits deben sumar 100%");
    });

    it("should reject if caller doesn't own ideas", async function () {
      const { vault, collaborator } = await loadFixture(mintedVaultFixture);
      await expect(
        vault.connect(collaborator).createVault([0], [collaborator.address], [10000], "ipfs://meta")
      ).to.be.revertedWith("Debes ser dueno de todas las ideas");
    });

    it("should reject mismatched collaborators/splits length", async function () {
      const { vault, artist } = await loadFixture(mintedVaultFixture);
      await expect(
        vault.connect(artist).createVault([0], [artist.address], [6000, 4000], "ipfs://meta")
      ).to.be.revertedWith("Colaboradores y splits deben coincidir");
    });
  });

  describe("Fund Vault", function () {
    it("should distribute funds according to splits", async function () {
      const { vault, sonata, artist, collaborator, funder } = await loadFixture(mintedVaultFixture);

      await vault.connect(artist).createVault(
        [0],
        [artist.address, collaborator.address],
        [6000, 4000],
        "ipfs://meta"
      );

      const artistBalBefore = await ethers.provider.getBalance(artist.address);
      const collabBalBefore = await ethers.provider.getBalance(collaborator.address);

      const fundAmount = ethers.parseEther("1.0");
      await vault.connect(funder).fundVault(0, { value: fundAmount });

      const artistBalAfter = await ethers.provider.getBalance(artist.address);
      const collabBalAfter = await ethers.provider.getBalance(collaborator.address);

      expect(artistBalAfter - artistBalBefore).to.equal(ethers.parseEther("0.6"));
      expect(collabBalAfter - collabBalBefore).to.equal(ethers.parseEther("0.4"));
    });

    it("should update totalReceived", async function () {
      const { vault, artist, funder } = await loadFixture(mintedVaultFixture);

      await vault.connect(artist).createVault([0], [artist.address], [10000], "ipfs://meta");
      await vault.connect(funder).fundVault(0, { value: ethers.parseEther("0.5") });

      const [, , , , , , received] = await vault.getVault(0);
      expect(received).to.equal(ethers.parseEther("0.5"));
    });

    it("should reject funding non-existent vault", async function () {
      const { vault, funder } = await loadFixture(mintedVaultFixture);
      await expect(
        vault.connect(funder).fundVault(999, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Vault no existe");
    });
  });

  describe("Queries", function () {
    it("should return creator's vault list", async function () {
      const { vault, artist } = await loadFixture(mintedVaultFixture);

      await vault.connect(artist).createVault([0], [artist.address], [10000], "ipfs://1");
      await vault.connect(artist).createVault([1], [artist.address], [10000], "ipfs://2");

      const ids = await vault.getCreatorVaults(artist.address);
      expect(ids.length).to.equal(2);
    });

    it("totalVaults starts at 0", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.totalVaults()).to.equal(0);
    });
  });
});
