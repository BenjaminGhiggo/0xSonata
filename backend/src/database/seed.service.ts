import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { Idea } from './entities/idea.entity';
import { CreativeStep } from './entities/creative-step.entity';

const SEED_ARTISTS: Partial<Artist>[] = [
  {
    address: '0x000000000000000000000000000000000000VA01',
    alias: 'Jake_FL',
    totalMints: 1,
    totalVerificationsGiven: 0,
    totalVerificationsReceived: 1,
    tier: 0,
    score: 4,
    isSeed: true,
  },
  {
    address: '0x000000000000000000000000000000000000DI02',
    alias: 'Diego_Prod',
    totalMints: 1,
    totalVerificationsGiven: 0,
    totalVerificationsReceived: 0,
    tier: 0,
    score: 3,
    isSeed: true,
  },
  {
    address: '0x000000000000000000000000000000000000AN03',
    alias: 'Andres_M',
    totalMints: 0,
    totalVerificationsGiven: 0,
    totalVerificationsReceived: 0,
    tier: 0,
    score: 2,
    isSeed: true,
  },
  {
    address: '0x000000000000000000000000000000000000CA04',
    alias: 'Camila_AI',
    totalMints: 0,
    totalVerificationsGiven: 0,
    totalVerificationsReceived: 0,
    tier: 0,
    score: 1,
    isSeed: true,
  },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Ensuring seed data...');

    for (const data of SEED_ARTISTS) {
      const exists = await this.artistRepo.findOne({ where: { address: data.address } });
      if (exists) {
        Object.assign(exists, data);
        await this.artistRepo.save(exists);
        continue;
      }
      const artist = this.artistRepo.create(data);
      await this.artistRepo.save(artist);
    }

    this.logger.log(`Seeded/updated ${SEED_ARTISTS.length} artists for leaderboard (scores min 1-4)`);
  }
}
