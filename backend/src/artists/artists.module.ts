import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { Artist, Idea } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Artist, Idea]), BlockchainModule, LeaderboardModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
