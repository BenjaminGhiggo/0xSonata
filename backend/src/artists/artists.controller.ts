// POR QUE: "Ventanilla" HTTP para consultas sobre artistas.
//   Maneja 2 rutas bajo /api/artists/:address/
//
// QUE:
//   GET /api/artists/:address/stats -> estadisticas del artista
//   GET /api/artists/:address/ideas -> lista de ideas del artista
//
// COMO: @Controller('artists') registra el prefijo /api/artists
//   Cada @Get() define una sub-ruta. @Param('address') extrae
//   la direccion Ethereum de la URL.

import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ArtistsService } from './artists.service';

@Controller('artists')
export class ArtistsController {
  private readonly logger = new Logger(ArtistsController.name);

  constructor(private readonly artistsService: ArtistsService) {}

  // GET /api/artists/0x1234.../stats
  // Devuelve: { address, totalMints, totalVerificationsGiven }
  @Get(':address/stats')
  async getStats(@Param('address') address: string) {
    this.logger.debug(`GET /api/artists/${address}/stats`);
    return this.artistsService.getStats(address);
  }

  // GET /api/artists/0x1234.../ideas
  // Devuelve: array de ideas con { tokenId, audioHash, timestamp, creator, verificationCount }
  @Get(':address/ideas')
  async getIdeas(@Param('address') address: string) {
    this.logger.debug(`GET /api/artists/${address}/ideas`);
    return this.artistsService.getIdeas(address);
  }
}
