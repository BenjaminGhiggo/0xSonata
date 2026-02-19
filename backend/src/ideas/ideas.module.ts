// POR QUE: Cada "funcionalidad" en NestJS vive en su propio modulo.
//   El modulo de ideas agrupa el controller (ventanilla HTTP) y
//   el service (logica de negocio) relacionados con ideas musicales.
//
// QUE: Importa BlockchainModule (para acceder a la chain) y registra
//   el IdeasController y IdeasService.
//
// COMO: NestJS lee este modulo al arrancar. Crea las instancias de
//   controller y service, e inyecta automaticamente las dependencias
//   (ej: el IdeasService recibe el BlockchainService en su constructor
//   porque BlockchainModule esta importado y exporta BlockchainService).

import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

@Module({
  imports: [BlockchainModule],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
