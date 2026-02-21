import { Controller, Get, Param } from '@nestjs/common';
import { ArtistsService } from './artists.service';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get(':address/stats')
  async getStats(@Param('address') address: string) {
    return this.artistsService.getStats(address);
  }

  @Get(':address/ideas')
  async getIdeas(@Param('address') address: string) {
    return this.artistsService.getIdeas(address);
  }
}
