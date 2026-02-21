import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../database/entities/artist.entity';

const TIER_LABELS = ['Emergente', 'Bronce', 'Plata', 'Oro'];
const STEP_TYPE_LABELS = ['Prompt', 'Variaciones IA', 'Seleccion', 'Edicion DAW', 'Master Final'];

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
  ) {}

  async getLeaderboard(limit = 20) {
    const artists = await this.artistRepo.find({
      order: { score: 'DESC' },
      take: limit,
    });

    return artists.map((a, index) => ({
      rank: index + 1,
      address: a.address,
      alias: a.alias || this.shortenAddress(a.address),
      totalMints: a.totalMints,
      totalVerificationsReceived: a.totalVerificationsReceived,
      tier: a.tier,
      tierLabel: TIER_LABELS[a.tier] || 'Emergente',
      score: a.score,
      isSeed: a.isSeed,
    }));
  }

  async upsertArtist(data: {
    address: string;
    alias?: string;
    totalMints: number;
    totalVerificationsGiven: number;
    totalVerificationsReceived: number;
    tier: number;
  }) {
    const score = this.calculateScore(data);
    const existing = await this.artistRepo.findOne({ where: { address: data.address.toLowerCase() } });

    if (existing) {
      Object.assign(existing, { ...data, address: data.address.toLowerCase(), score });
      return this.artistRepo.save(existing);
    }

    const artist = this.artistRepo.create({
      ...data,
      address: data.address.toLowerCase(),
      score,
      isSeed: false,
    });
    return this.artistRepo.save(artist);
  }

  private calculateScore(data: {
    totalMints: number;
    totalVerificationsReceived: number;
    totalVerificationsGiven?: number;
  }): number {
    return (
      data.totalMints * 1000 +
      data.totalVerificationsReceived * 500 +
      (data.totalVerificationsGiven || 0) * 200
    );
  }

  private shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
