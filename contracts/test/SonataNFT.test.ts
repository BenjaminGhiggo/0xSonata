import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("SonataNFT", function () {
  const SAMPLE_HASH = ethers.id("test-audio-file-content");
  const SAMPLE_HASH_2 = ethers.id("another-audio-file");
  const SAMPLE_URI = "ipfs://QmTestHash123";

  async function deploySonataFixture() {
    const [owner, artist, verifier, thirdUser] = await ethers.getSigners();
    const SonataNFT = await ethers.getContractFactory("SonataNFT");
    const sonata = await SonataNFT.deploy();
    return { sonata, owner, artist, verifier, thirdUser };
  }

  describe("Mint", function () {
    it("should mint with valid hash and assign token to artist", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);

      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);

      expect(await sonata.totalSupply()).to.equal(1);
      expect(await sonata.ownerOf(0)).to.equal(artist.address);
      expect(await sonata.isHashRegistered(SAMPLE_HASH)).to.be.true;
    });

    it("should emit SonataMinted event with correct args", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);

      await expect(sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI))
        .to.emit(sonata, "SonataMinted")
        .withArgs(0, artist.address, SAMPLE_HASH, anyValue);
    });

    it("should store correct proof data", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);

      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      const proof = await sonata.getProof(0);

      expect(proof.audioHash).to.equal(SAMPLE_HASH);
      expect(proof.creator).to.equal(artist.address);
      expect(proof.verificationCount).to.equal(0);
      expect(proof.timestamp).to.be.greaterThan(0);
    });

    it("should increment creatorMintCount", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);

      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      await sonata.connect(artist).mint(SAMPLE_HASH_2, "ipfs://other");

      const [totalMints] = await sonata.getCreatorStats(artist.address);
      expect(totalMints).to.equal(2);
    });

    it("should set correct tokenURI", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);

      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      expect(await sonata.tokenURI(0)).to.equal(SAMPLE_URI);
    });

    it("should reject zero hash", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);

      await expect(
        sonata.connect(artist).mint(ethers.ZeroHash, SAMPLE_URI)
      ).to.be.revertedWith("Hash invalido");
    });

    it("should reject duplicate hash", async function () {
      const { sonata, artist, verifier } = await loadFixture(deploySonataFixture);

      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      await expect(
        sonata.connect(verifier).mint(SAMPLE_HASH, "ipfs://other")
      ).to.be.revertedWith("Este audio ya fue registrado");
    });

    it("should assign sequential token IDs", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);

      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      await sonata.connect(artist).mint(SAMPLE_HASH_2, "ipfs://second");

      expect(await sonata.ownerOf(0)).to.equal(artist.address);
      expect(await sonata.ownerOf(1)).to.equal(artist.address);
      expect(await sonata.totalSupply()).to.equal(2);
    });
  });

  describe("Verify", function () {
    async function mintedFixture() {
      const base = await deploySonataFixture();
      await base.sonata.connect(base.artist).mint(SAMPLE_HASH, SAMPLE_URI);
      return base;
    }

    it("should verify another artist's idea", async function () {
      const { sonata, verifier } = await loadFixture(mintedFixture);

      await sonata.connect(verifier).verify(0);
      const proof = await sonata.getProof(0);
      expect(proof.verificationCount).to.equal(1);
    });

    it("should emit SonataVerified event", async function () {
      const { sonata, verifier } = await loadFixture(mintedFixture);

      await expect(sonata.connect(verifier).verify(0))
        .to.emit(sonata, "SonataVerified")
        .withArgs(0, verifier.address, 1);
    });

    it("should allow multiple different verifiers", async function () {
      const { sonata, verifier, thirdUser } = await loadFixture(mintedFixture);

      await sonata.connect(verifier).verify(0);
      await sonata.connect(thirdUser).verify(0);

      const proof = await sonata.getProof(0);
      expect(proof.verificationCount).to.equal(2);
    });

    it("should increment verifierCount for the verifier", async function () {
      const { sonata, verifier } = await loadFixture(mintedFixture);

      await sonata.connect(verifier).verify(0);
      const [, totalVerificationsGiven] = await sonata.getCreatorStats(verifier.address);
      expect(totalVerificationsGiven).to.equal(1);
    });

    it("should reject self-verification", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);

      await expect(
        sonata.connect(artist).verify(0)
      ).to.be.revertedWith("No puedes verificar tu propia idea");
    });

    it("should reject double verification from same address", async function () {
      const { sonata, verifier } = await loadFixture(mintedFixture);

      await sonata.connect(verifier).verify(0);
      await expect(
        sonata.connect(verifier).verify(0)
      ).to.be.revertedWith("Ya verificaste esta idea");
    });

    it("should reject verification of non-existent token", async function () {
      const { sonata, verifier } = await loadFixture(mintedFixture);

      await expect(
        sonata.connect(verifier).verify(999)
      ).to.be.revertedWith("Token no existe");
    });
  });

  describe("Queries", function () {
    it("totalSupply starts at 0", async function () {
      const { sonata } = await loadFixture(deploySonataFixture);
      expect(await sonata.totalSupply()).to.equal(0);
    });

    it("isHashRegistered returns false for unknown hash", async function () {
      const { sonata } = await loadFixture(deploySonataFixture);
      expect(await sonata.isHashRegistered(SAMPLE_HASH)).to.be.false;
    });

    it("getProof reverts for non-existent token", async function () {
      const { sonata } = await loadFixture(deploySonataFixture);
      await expect(sonata.getProof(0)).to.be.revertedWith("Token no existe");
    });

    it("getCreatorStats returns zeros for unknown address", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      const [mints, verifications] = await sonata.getCreatorStats(artist.address);
      expect(mints).to.equal(0);
      expect(verifications).to.equal(0);
    });
  });
});
