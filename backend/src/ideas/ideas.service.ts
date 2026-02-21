import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Idea } from '../database/entities/idea.entity';
import { CreativeStep } from '../database/entities/creative-step.entity';

@Injectable()
export class IdeasService {
  constructor(
    private readonly blockchainService: BlockchainService,
    @InjectRepository(Idea) private ideaRepo: Repository<Idea>,
    @InjectRepository(CreativeStep) private stepRepo: Repository<CreativeStep>,
  ) {}

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
    let idea = await this.ideaRepo.findOne({ where: { tokenId: data.tokenId } });

    if (idea) {
      Object.assign(idea, data);
    } else {
      idea = this.ideaRepo.create(data);
    }

    return this.ideaRepo.save(idea);
  }

  async syncStep(data: {
    tokenId: number;
    contentHash: string;
    stepType: number;
    metadata: string;
    blockTimestamp: number;
    txHash?: string;
  }) {
    const step = this.stepRepo.create(data);
    return this.stepRepo.save(step);
  }
}
