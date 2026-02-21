import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

const SONATA_ABI = [
  'function totalSupply() view returns (uint256)',
  'function getCreatorStats(address creator) view returns (uint256 totalMints, uint256 totalVerificationsGiven, uint256 totalVerificationsReceived, uint8 tier)',
  'function getProof(uint256 tokenId) view returns (tuple(bytes32 audioHash, uint256 timestamp, address creator, uint256 verificationCount, uint256 stepCount))',
  'function getCreativeSteps(uint256 tokenId) view returns (tuple(bytes32 contentHash, uint8 stepType, uint256 timestamp, string metadata)[])',
  'function isHashRegistered(bytes32 audioHash) view returns (bool)',
  'function getTier(address creator) view returns (uint8)',
  'function getVerificationWeight(address verifier) view returns (uint256)',
  'function stakeBalance(address) view returns (uint256)',
  'function MIN_STAKE() view returns (uint256)',
];

const VAULT_ABI = [
  'function totalVaults() view returns (uint256)',
  'function getVault(uint256 vaultId) view returns (uint256 id, address creator, uint256[] ideaTokenIds, address[] collaborators, uint256[] splits, string metadataURI, uint256 totalReceived, uint256 createdAt)',
  'function getCreatorVaults(address creator) view returns (uint256[])',
];

export interface SonataProof {
  audioHash: string;
  timestamp: number;
  creator: string;
  verificationCount: number;
  stepCount: number;
}

export interface CreativeStepData {
  contentHash: string;
  stepType: number;
  timestamp: number;
  metadata: string;
}

export interface CreatorStats {
  totalMints: number;
  totalVerificationsGiven: number;
  totalVerificationsReceived: number;
  tier: number;
}

export interface VaultData {
  id: number;
  creator: string;
  ideaTokenIds: number[];
  collaborators: string[];
  splits: number[];
  metadataURI: string;
  totalReceived: string;
  createdAt: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider!: ethers.JsonRpcProvider;
  private sonataNft!: ethers.Contract;
  private projectVault!: ethers.Contract;
  private isReady = false;
  private hasVault = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const rpcUrl = this.configService.get<string>('rpcUrl', '');
    const nftAddress = this.configService.get<string>('sonataNftAddress', '');
    const vaultAddress = this.configService.get<string>('projectVaultAddress', '');

    if (!rpcUrl) {
      this.logger.error('RPC_URL no configurada');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (nftAddress) {
      this.sonataNft = new ethers.Contract(nftAddress, SONATA_ABI, this.provider);
      this.isReady = true;
      this.logger.log(`SonataNFT conectado: ${nftAddress}`);
    }

    if (vaultAddress) {
      this.projectVault = new ethers.Contract(vaultAddress, VAULT_ABI, this.provider);
      this.hasVault = true;
      this.logger.log(`ProjectVault conectado: ${vaultAddress}`);
    }
  }

  private ensureReady(): void {
    if (!this.isReady) {
      throw new Error('BlockchainService no conectado. Configura SONATA_NFT_ADDRESS en .env');
    }
  }

  async getProof(tokenId: number): Promise<SonataProof> {
    this.ensureReady();
    const proof = await this.sonataNft.getProof(tokenId);
    return {
      audioHash: proof.audioHash,
      timestamp: Number(proof.timestamp),
      creator: proof.creator,
      verificationCount: Number(proof.verificationCount),
      stepCount: Number(proof.stepCount),
    };
  }

  async getCreativeSteps(tokenId: number): Promise<CreativeStepData[]> {
    this.ensureReady();
    const steps = await this.sonataNft.getCreativeSteps(tokenId);
    return steps.map((s: any) => ({
      contentHash: s.contentHash,
      stepType: Number(s.stepType),
      timestamp: Number(s.timestamp),
      metadata: s.metadata,
    }));
  }

  async getCreatorStats(address: string): Promise<CreatorStats> {
    this.ensureReady();
    const [totalMints, totalVerificationsGiven, totalVerificationsReceived, tier] =
      await this.sonataNft.getCreatorStats(address);
    return {
      totalMints: Number(totalMints),
      totalVerificationsGiven: Number(totalVerificationsGiven),
      totalVerificationsReceived: Number(totalVerificationsReceived),
      tier: Number(tier),
    };
  }

  async getTotalSupply(): Promise<number> {
    this.ensureReady();
    return Number(await this.sonataNft.totalSupply());
  }

  async getIdeasByCreator(address: string): Promise<Array<SonataProof & { tokenId: number }>> {
    this.ensureReady();
    const totalSupply = await this.getTotalSupply();
    const ideas: Array<SonataProof & { tokenId: number }> = [];

    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        const proof = await this.getProof(tokenId);
        if (proof.creator.toLowerCase() === address.toLowerCase()) {
          ideas.push({ tokenId, ...proof });
        }
      } catch {
        continue;
      }
    }
    return ideas;
  }

  async getStakeBalance(address: string): Promise<string> {
    this.ensureReady();
    const bal = await this.sonataNft.stakeBalance(address);
    return ethers.formatEther(bal);
  }

  async getVault(vaultId: number): Promise<VaultData> {
    if (!this.hasVault) throw new Error('ProjectVault no configurado');
    const v = await this.projectVault.getVault(vaultId);
    return {
      id: Number(v.id),
      creator: v.creator,
      ideaTokenIds: v.ideaTokenIds.map(Number),
      collaborators: [...v.collaborators],
      splits: v.splits.map(Number),
      metadataURI: v.metadataURI,
      totalReceived: ethers.formatEther(v.totalReceived),
      createdAt: Number(v.createdAt),
    };
  }

  async getCreatorVaults(address: string): Promise<number[]> {
    if (!this.hasVault) throw new Error('ProjectVault no configurado');
    const ids = await this.projectVault.getCreatorVaults(address);
    return ids.map(Number);
  }
}
