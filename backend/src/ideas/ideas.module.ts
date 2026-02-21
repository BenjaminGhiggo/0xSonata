import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { Idea, CreativeStep, Artist } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Idea, CreativeStep, Artist]), BlockchainModule],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
