// POR QUE: Modulo que agrupa la funcionalidad de artistas.
//   Importa BlockchainModule para poder consultar la chain.
//
// QUE: Registra ArtistsController (rutas HTTP) y ArtistsService (logica).
//
// COMO: NestJS inyecta BlockchainService en ArtistsService automaticamente
//   porque BlockchainModule esta importado y exporta ese servicio.

import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

@Module({
  imports: [BlockchainModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
