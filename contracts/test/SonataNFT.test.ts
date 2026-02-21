import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("SonataNFT", function () {
  const SAMPLE_HASH = ethers.id("test-audio-file-content");
  const SAMPLE_HASH_2 = ethers.id("another-audio-file");
  const SAMPLE_URI = "ipfs://QmTestHash123";
  const STEP_HASH = ethers.id("prompt-text-reggaeton-120bpm");
  const MIN_STAKE = ethers.parseEther("0.001");

  async function deploySonataFixture() {
    const [owner, artist, verifier, thirdUser] = await ethers.getSigners();
    const SonataNFT = await ethers.getContractFactory("SonataNFT");
    const sonata = await SonataNFT.deploy();
    return { sonata, owner, artist, verifier, thirdUser };
  }

  async function mintedFixture() {
    const base = await deploySonataFixture();
    await base.sonata.connect(base.artist).mint(SAMPLE_HASH, SAMPLE_URI);
    return base;
  }

  async function stakedVerifierFixture() {
    const base = await mintedFixture();
    await base.sonata.connect(base.verifier).deposit({ value: MIN_STAKE });
    return base;
  }

  // =========================================================================
  // CAPA 1 — Mint
  // =========================================================================

  describe("Mint", function () {
    it("should mint with valid hash and assign token to artist", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      expect(await sonata.totalSupply()).to.equal(1);
      expect(await sonata.ownerOf(0)).to.equal(artist.address);
      expect(await sonata.isHashRegistered(SAMPLE_HASH)).to.be.true;
    });

    it("should emit SonataMinted event", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      await expect(sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI))
        .to.emit(sonata, "SonataMinted")
        .withArgs(0, artist.address, SAMPLE_HASH, anyValue);
    });

    it("should store correct proof with stepCount=0", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      const proof = await sonata.getProof(0);
      expect(proof.audioHash).to.equal(SAMPLE_HASH);
      expect(proof.creator).to.equal(artist.address);
      expect(proof.verificationCount).to.equal(0);
      expect(proof.stepCount).to.equal(0);
    });

    it("should set firstActivityTimestamp on first mint", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      await sonata.connect(artist).mint(SAMPLE_HASH, SAMPLE_URI);
      expect(await sonata.firstActivityTimestamp(artist.address)).to.be.greaterThan(0);
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
  });

  // =========================================================================
  // CAPA 1 — Creative Steps
  // =========================================================================

  describe("Creative Steps", function () {
    it("should add a creative step to a minted token", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);
      await sonata.connect(artist).addStep(0, STEP_HASH, 0, "Prompt: reggaeton 120bpm");
      const steps = await sonata.getCreativeSteps(0);
      expect(steps.length).to.equal(1);
      expect(steps[0].contentHash).to.equal(STEP_HASH);
      expect(steps[0].stepType).to.equal(0);
      expect(steps[0].metadata).to.equal("Prompt: reggaeton 120bpm");
    });

    it("should increment stepCount in proof", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);
      await sonata.connect(artist).addStep(0, STEP_HASH, 0, "Prompt");
      await sonata.connect(artist).addStep(0, ethers.id("variation"), 1, "5 variaciones Suno");
      const proof = await sonata.getProof(0);
      expect(proof.stepCount).to.equal(2);
    });

    it("should emit StepAdded event", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);
      await expect(sonata.connect(artist).addStep(0, STEP_HASH, 0, "Prompt"))
        .to.emit(sonata, "StepAdded")
        .withArgs(0, 0, STEP_HASH);
    });

    it("should reject addStep from non-creator", async function () {
      const { sonata, verifier } = await loadFixture(mintedFixture);
      await expect(
        sonata.connect(verifier).addStep(0, STEP_HASH, 0, "Hack")
      ).to.be.revertedWith("Solo el creador puede agregar pasos");
    });

    it("should reject invalid stepType > 4", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);
      await expect(
        sonata.connect(artist).addStep(0, STEP_HASH, 5, "Invalid")
      ).to.be.revertedWith("Tipo de paso invalido");
    });

    it("should reject zero hash in step", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);
      await expect(
        sonata.connect(artist).addStep(0, ethers.ZeroHash, 0, "Empty")
      ).to.be.revertedWith("Hash invalido");
    });

    it("should support full 5-step creative chain", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);

      await sonata.connect(artist).addStep(0, ethers.id("prompt"), 0, "Prompt inicial");
      await sonata.connect(artist).addStep(0, ethers.id("variations"), 1, "5 variaciones Suno");
      await sonata.connect(artist).addStep(0, ethers.id("selection"), 2, "Variacion 3 de 5");
      await sonata.connect(artist).addStep(0, ethers.id("daw-edit"), 3, "Edicion GarageBand");
      await sonata.connect(artist).addStep(0, ethers.id("master"), 4, "Master final exportado");

      const steps = await sonata.getCreativeSteps(0);
      expect(steps.length).to.equal(5);
      expect(steps[4].stepType).to.equal(4);

      const proof = await sonata.getProof(0);
      expect(proof.stepCount).to.equal(5);
    });
  });

  // =========================================================================
  // CAPA 2 — Stake + Verify
  // =========================================================================

  describe("Stake", function () {
    it("should accept deposits", async function () {
      const { sonata, verifier } = await loadFixture(deploySonataFixture);
      await sonata.connect(verifier).deposit({ value: MIN_STAKE });
      expect(await sonata.stakeBalance(verifier.address)).to.equal(MIN_STAKE);
    });

    it("should emit StakeDeposited event", async function () {
      const { sonata, verifier } = await loadFixture(deploySonataFixture);
      await expect(sonata.connect(verifier).deposit({ value: MIN_STAKE }))
        .to.emit(sonata, "StakeDeposited")
        .withArgs(verifier.address, MIN_STAKE);
    });

    it("should allow withdrawal", async function () {
      const { sonata, verifier } = await loadFixture(deploySonataFixture);
      await sonata.connect(verifier).deposit({ value: MIN_STAKE });
      await sonata.connect(verifier).withdraw(MIN_STAKE);
      expect(await sonata.stakeBalance(verifier.address)).to.equal(0);
    });

    it("should reject withdrawal exceeding balance", async function () {
      const { sonata, verifier } = await loadFixture(deploySonataFixture);
      await expect(
        sonata.connect(verifier).withdraw(MIN_STAKE)
      ).to.be.revertedWith("Fondos insuficientes");
    });

    it("should reject zero deposit", async function () {
      const { sonata, verifier } = await loadFixture(deploySonataFixture);
      await expect(
        sonata.connect(verifier).deposit({ value: 0 })
      ).to.be.revertedWith("Debe enviar fondos");
    });
  });

  describe("Verify (with stake)", function () {
    it("should verify when verifier has sufficient stake", async function () {
      const { sonata, verifier } = await loadFixture(stakedVerifierFixture);
      await sonata.connect(verifier).verify(0);
      const proof = await sonata.getProof(0);
      expect(proof.verificationCount).to.equal(1);
    });

    it("should reject verify without stake", async function () {
      const { sonata, verifier } = await loadFixture(mintedFixture);
      await expect(
        sonata.connect(verifier).verify(0)
      ).to.be.revertedWith("Stake insuficiente para verificar");
    });

    it("should increment verificationsReceived for creator", async function () {
      const { sonata, artist, verifier } = await loadFixture(stakedVerifierFixture);
      await sonata.connect(verifier).verify(0);
      expect(await sonata.verificationsReceived(artist.address)).to.equal(1);
    });

    it("should reject self-verification", async function () {
      const { sonata, artist } = await loadFixture(mintedFixture);
      await sonata.connect(artist).deposit({ value: MIN_STAKE });
      await expect(
        sonata.connect(artist).verify(0)
      ).to.be.revertedWith("No puedes verificar tu propia idea");
    });

    it("should reject double verification", async function () {
      const { sonata, verifier } = await loadFixture(stakedVerifierFixture);
      await sonata.connect(verifier).verify(0);
      await expect(
        sonata.connect(verifier).verify(0)
      ).to.be.revertedWith("Ya verificaste esta idea");
    });
  });

  // =========================================================================
  // CAPA 3 — Tiers
  // =========================================================================

  describe("Tiers", function () {
    it("should return Emergente (0) for new user", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      expect(await sonata.getTier(artist.address)).to.equal(0);
    });

    it("should return Emergente (0) after a few mints", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      for (let i = 0; i < 3; i++) {
        await sonata.connect(artist).mint(ethers.id(`audio-${i}`), `ipfs://${i}`);
      }
      expect(await sonata.getTier(artist.address)).to.equal(0);
    });

    it("should return verification weight 1 for Emergente", async function () {
      const { sonata, artist } = await loadFixture(deploySonataFixture);
      expect(await sonata.getVerificationWeight(artist.address)).to.equal(1);
    });

    it("getCreatorStats should return all metrics", async function () {
      const { sonata, artist, verifier } = await loadFixture(stakedVerifierFixture);
      await sonata.connect(verifier).verify(0);

      const [mints, verifGiven, verifReceived, tier] = await sonata.getCreatorStats(artist.address);
      expect(mints).to.equal(1);
      expect(verifGiven).to.equal(0);
      expect(verifReceived).to.equal(1);
      expect(tier).to.equal(0);
    });
  });
});
