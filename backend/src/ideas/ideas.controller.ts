import { Controller, Get, Post, Param, Body, ParseIntPipe, HttpCode } from '@nestjs/common';
import { IdeasService } from './ideas.service';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get(':tokenId')
  async getIdea(@Param('tokenId', ParseIntPipe) tokenId: number) {
    return this.ideasService.getIdea(tokenId);
  }

  @Post('sync')
  @HttpCode(200)
  async syncIdea(
    @Body() body: {
      tokenId: number;
      audioHash: string;
      creatorAddress: string;
      verificationCount: number;
      stepCount: number;
      tokenURI?: string;
      blockTimestamp: number;
      txHash?: string;
    },
  ) {
    return this.ideasService.syncIdea(body);
  }

  @Post('sync-step')
  @HttpCode(200)
  async syncStep(
    @Body() body: {
      tokenId: number;
      contentHash: string;
      stepType: number;
      metadata: string;
      blockTimestamp: number;
      txHash?: string;
    },
  ) {
    return this.ideasService.syncStep(body);
  }
}
