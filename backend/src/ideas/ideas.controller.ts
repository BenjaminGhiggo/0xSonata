// POR QUE: El controller es la "ventanilla" HTTP. Recibe las peticiones
//   del frontend, extrae los parametros de la URL, y delega el trabajo
//   al service. No contiene logica de negocio, solo maneja HTTP.
//
// QUE: Endpoint GET /api/ideas/:tokenId
//   Recibe un tokenId en la URL, lo convierte a numero, y devuelve
//   los datos de la idea (hash, timestamp, creator, verificationCount).
//
// COMO: @Controller('ideas') registra esta clase para rutas /api/ideas/*
//   @Get(':tokenId') captura el segmento de la URL como parametro.
//   @Param('tokenId') extrae ese valor y lo pasa al metodo.

import { Controller, Get, Param, Logger } from '@nestjs/common';
import { IdeasService } from './ideas.service';

@Controller('ideas')
export class IdeasController {
  private readonly logger = new Logger(IdeasController.name);

  constructor(private readonly ideasService: IdeasService) {}

  // GET /api/ideas/:tokenId
  // Ejemplo: GET /api/ideas/0 -> devuelve datos de la primera idea registrada
  @Get(':tokenId')
  async getProof(@Param('tokenId') tokenIdParam: string) {
    // Convertimos el parametro de string a numero
    // La URL siempre llega como string, necesitamos un entero
    const tokenId = parseInt(tokenIdParam, 10);

    // Validacion basica: verificamos que sea un numero valido
    if (isNaN(tokenId) || tokenId < 0) {
      this.logger.debug(`tokenId invalido recibido: "${tokenIdParam}"`);
      return { error: 'tokenId debe ser un numero entero >= 0' };
    }

    this.logger.debug(`GET /api/ideas/${tokenId}`);
    return this.ideasService.getProof(tokenId);
  }
}
