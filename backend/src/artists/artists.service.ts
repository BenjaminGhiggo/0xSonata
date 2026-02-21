import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { Artist } from '../database/entities/artist.entity';
import { Idea } from '../database/entities/idea.entity';

@Injectable()
export class ArtistsService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly leaderboardService: LeaderboardService,
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Idea) private ideaRepo: Repository<Idea>,
  ) {}

  async getStats(address: string) {
    const dbArtist = await this.artistRepo.findOne({
      where: { address: ILike(address) },
    });

    try {
      const onChain = await this.blockchainService.getCreatorStats(address);
      const stakeBalance = await this.blockchainService.getStakeBalance(address);

      await this.leaderboardService.upsertArtist({
        address,
        totalMints: onChain.totalMints,
        totalVerificationsGiven: onChain.totalVerificationsGiven,
        totalVerificationsReceived: onChain.totalVerificationsReceived,
        tier: onChain.tier,
      });

      return {
        address,
        alias: dbArtist?.alias || null,
        ...onChain,
        stakeBalance,
      };
    } catch {
      if (dbArtist) {
        return {
          address: dbArtist.address,
          alias: dbArtist.alias,
          totalMints: dbArtist.totalMints,
          totalVerificationsGiven: dbArtist.totalVerificationsGiven,
          totalVerificationsReceived: dbArtist.totalVerificationsReceived,
          tier: dbArtist.tier,
          stakeBalance: '0',
        };
      }
      throw new NotFoundException(`Artista ${address} no encontrado`);
    }
  }

  async getIdeas(address: string) {
    const dbIdeas = await this.ideaRepo.find({
      where: { creatorAddress: ILike(address) },
      relations: ['steps'],
      order: { tokenId: 'DESC' },
    });

    if (dbIdeas.length > 0) {
      return dbIdeas.map((idea) => ({
        tokenId: idea.tokenId,
        audioHash: idea.audioHash,
        verificationCount: idea.verificationCount,
        stepCount: idea.stepCount,
        timestamp: idea.blockTimestamp,
      }));
    }

    try {
      return await this.blockchainService.getIdeasByCreator(address);
    } catch {
      return [];
    }
  }
}
