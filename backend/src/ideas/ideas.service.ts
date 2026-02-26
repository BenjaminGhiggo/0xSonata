import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Idea } from '../database/entities/idea.entity';
import { CreativeStep } from '../database/entities/creative-step.entity';
import { Artist } from '../database/entities/artist.entity';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

@Injectable()
export class IdeasService {
  constructor(
    private readonly blockchainService: BlockchainService,
    @InjectRepository(Idea) private ideaRepo: Repository<Idea>,
    @InjectRepository(CreativeStep) private stepRepo: Repository<CreativeStep>,
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    private readonly leaderboardService: LeaderboardService,
  ) { }

  async getIdea(tokenId: number) {
    const dbIdea = await this.ideaRepo.findOne({
      where: { tokenId },
      relations: ['steps'],
    });

    if (dbIdea) {
      return {
        tokenId: dbIdea.tokenId,
        audioHash: dbIdea.audioHash,
        creator: dbIdea.creatorAddress,
        verificationCount: dbIdea.verificationCount,
        stepCount: dbIdea.stepCount,
        timestamp: dbIdea.blockTimestamp,
        steps: dbIdea.steps?.map((s) => ({
          contentHash: s.contentHash,
          stepType: s.stepType,
          timestamp: s.blockTimestamp,
          metadata: s.metadata,
        })) || [],
      };
    }

    try {
      const proof = await this.blockchainService.getProof(tokenId);
      const steps = await this.blockchainService.getCreativeSteps(tokenId);
      return {
        tokenId,
        audioHash: proof.audioHash,
        creator: proof.creator,
        verificationCount: proof.verificationCount,
        stepCount: proof.stepCount,
        timestamp: proof.timestamp,
        steps: steps.map((s) => ({
          contentHash: s.contentHash,
          stepType: s.stepType,
          timestamp: s.timestamp,
          metadata: s.metadata,
        })),
      };
    } catch {
      throw new NotFoundException(`Idea ${tokenId} no encontrada`);
    }
  }

  async syncIdea(data: {
    tokenId: number;
    audioHash: string;
    creatorAddress: string;
    verificationCount: number;
    stepCount: number;
    tokenURI?: string;
    blockTimestamp: number;
    txHash?: string;
  }) {
    // Primero asegurar que el artista existe en DB
    const artistAddress = data.creatorAddress.toLowerCase();
    let artist = await this.artistRepo.findOne({ where: { address: artistAddress } });

    if (!artist) {
      // Artista no existe, crearlo
      artist = this.artistRepo.create({
        address: artistAddress,
        alias: undefined,
        totalMints: 0,
        totalVerificationsGiven: 0,
        totalVerificationsReceived: 0,
        tier: 0,
        score: 0,
        isSeed: false,
      });
      await this.artistRepo.save(artist);
    }

    // Ahora crear/actualizar la idea
    let idea = await this.ideaRepo.findOne({ where: { tokenId: data.tokenId } });

    if (idea) {
      Object.assign(idea, data);
    } else {
      idea = this.ideaRepo.create(data);
    }

    const savedIdea = await this.ideaRepo.save(idea);

    // Actualizar stats del artista en el leaderboard
    try {
      const stats = await this.blockchainService.getCreatorStats(artistAddress);
      await this.leaderboardService.upsertArtist({
        address: artistAddress,
        totalMints: stats.totalMints,
        totalVerificationsGiven: stats.totalVerificationsGiven,
        totalVerificationsReceived: stats.totalVerificationsReceived,
        tier: stats.tier,
      });
    } catch (error) {
      console.error('Failed to update leaderboard for', artistAddress, error);
    }

    return savedIdea;
  }

  async syncStep(data: {
    tokenId: number;
    contentHash: string;
    stepType: number;
    metadata: string;
    blockTimestamp: number;
    txHash?: string;
  }) {
    // Verificar si la idea existe, si no, crearla primero
    let idea = await this.ideaRepo.findOne({ where: { tokenId: data.tokenId } });

    if (!idea) {
      // Idea no existe, intentar obtener de blockchain
      try {
        const proof = await this.blockchainService.getProof(data.tokenId);
        await this.syncIdea({
          tokenId: data.tokenId,
          audioHash: proof.audioHash,
          creatorAddress: proof.creator,
          verificationCount: proof.verificationCount,
          stepCount: proof.stepCount,
          blockTimestamp: proof.timestamp,
        });
      } catch (error) {
        console.error(`Failed to fetch idea ${data.tokenId} from blockchain:`, error);
        throw new NotFoundException(`Idea ${data.tokenId} no encontrada en blockchain`);
      }
    }

    const step = this.stepRepo.create(data);
    return this.stepRepo.save(step);
  }

  async getTokenIdFromTx(txHash: string) {
    return this.blockchainService.getTokenIdFromTx(txHash);
  }

  async getTokensByCreator(creatorAddress: string) {
    return this.blockchainService.getTokenIdsByCreator(creatorAddress);
  }
}
