// POR QUE: El controller no debe contener logica de negocio directamente.
//   Si el dia de manana agregamos cache o validaciones adicionales,
//   lo hacemos aqui sin tocar el controller.
//
// QUE: Servicio intermedio entre el controller (HTTP) y el BlockchainService
//   (lectura on-chain). Hoy es un "pass-through" simple, pero es la capa
//   donde se agregaria cache, transformaciones, o validaciones de negocio.
//
// COMO: Recibe el tokenId del controller, llama al BlockchainService,
//   y devuelve el resultado. Si el contrato lanza un error (ej: token no existe),
//   lo captura y lo relanza como una excepcion HTTP que NestJS entiende.

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlockchainService, SonataProof } from '../blockchain/blockchain.service';

@Injectable()
export class IdeasService {
  private readonly logger = new Logger(IdeasService.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  async getProof(tokenId: number): Promise<SonataProof & { tokenId: number }> {
    this.logger.debug(`Buscando idea con tokenId: ${tokenId}`);

    try {
      const proof = await this.blockchainService.getProof(tokenId);
      return { tokenId, ...proof };
    } catch (error: unknown) {
      // Si el contrato revierte con "Token no existe", devolvemos un 404 HTTP
      // Esto traduce un error de blockchain a un error HTTP que el frontend entiende
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Error al buscar tokenId ${tokenId}: ${message}`);
      throw new NotFoundException(`Idea con tokenId ${tokenId} no encontrada`);
    }
  }
}
