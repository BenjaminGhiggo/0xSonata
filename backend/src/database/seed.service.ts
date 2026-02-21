import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { Idea } from './entities/idea.entity';
import { CreativeStep } from './entities/creative-step.entity';

const SEED_ARTISTS: Partial<Artist>[] = [
  {
    address: '0x000000000000000000000000000000000000VA01',
    alias: 'Valeria_FL',
    totalMints: 5,
    totalVerificationsGiven: 3,
    totalVerificationsReceived: 8,
    tier: 1,
    score: 4200,
    isSeed: true,
  },
  {
    address: '0x000000000000000000000000000000000000DI02',
    alias: 'Diego_Prod',
    totalMints: 3,
    totalVerificationsGiven: 2,
    totalVerificationsReceived: 4,
    tier: 0,
    score: 2800,
    isSeed: true,
  },
  {
    address: '0x000000000000000000000000000000000000AN03',
    alias: 'Andres_M',
    totalMints: 2,
    totalVerificationsGiven: 1,
    totalVerificationsReceived: 2,
    tier: 0,
    score: 1500,
    isSeed: true,
  },
  {
    address: '0x000000000000000000000000000000000000CA04',
    alias: 'Camila_AI',
    totalMints: 1,
    totalVerificationsGiven: 1,
    totalVerificationsReceived: 1,
    tier: 0,
    score: 800,
    isSeed: true,
  },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Idea) private ideaRepo: Repository<Idea>,
    @InjectRepository(CreativeStep) private stepRepo: Repository<CreativeStep>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.artistRepo.count({ where: { isSeed: true } });
    if (count >= SEED_ARTISTS.length) {
      this.logger.log('Seed data already exists, skipping');
      return;
    }

    this.logger.log('Inserting seed data...');

    for (const data of SEED_ARTISTS) {
      const exists = await this.artistRepo.findOne({ where: { address: data.address } });
      if (exists) continue;

      const artist = this.artistRepo.create(data);
      await this.artistRepo.save(artist);
    }

    this.logger.log(`Seeded ${SEED_ARTISTS.length} artists for leaderboard`);
  }
}
