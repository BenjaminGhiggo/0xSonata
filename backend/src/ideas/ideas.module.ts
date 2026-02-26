import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdeasController, BlockchainController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { Idea, CreativeStep, Artist } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Idea, CreativeStep, Artist]), BlockchainModule, LeaderboardModule],
  controllers: [IdeasController, BlockchainController],
  providers: [IdeasService],
})
export class IdeasModule { }
