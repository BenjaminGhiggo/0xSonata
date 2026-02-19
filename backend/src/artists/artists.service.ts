// POR QUE: Capa intermedia para consultas de artistas.
//   Separa la logica HTTP (controller) de la logica de negocio (service).
//
// QUE: Expone dos operaciones:
//   1. getStats(address): cuantas ideas registro y cuantas verifico
//   2. getIdeas(address): lista todas las ideas del artista
//
// COMO: Delega las llamadas al BlockchainService que hace las consultas
//   reales al contrato via RPC. Si hay error, lo traduce a HTTP.

import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService, CreatorStats, SonataProof } from '../blockchain/blockchain.service';

@Injectable()
export class ArtistsService {
  private readonly logger = new Logger(ArtistsService.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  async getStats(address: string): Promise<CreatorStats & { address: string }> {
    this.logger.debug(`Obteniendo stats para artista: ${address}`);

    try {
      const stats = await this.blockchainService.getCreatorStats(address);
      return { address, ...stats };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al obtener stats de ${address}: ${message}`);
      throw error;
    }
  }

  async getIdeas(address: string): Promise<Array<SonataProof & { tokenId: number }>> {
    this.logger.debug(`Obteniendo ideas para artista: ${address}`);

    try {
      return await this.blockchainService.getIdeasByCreator(address);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al obtener ideas de ${address}: ${message}`);
      throw error;
    }
  }
}
