// POR QUE: NestJS organiza el codigo en modulos. Cada modulo agrupa
//   un servicio con su funcionalidad. Este modulo encapsula el
//   BlockchainService y lo exporta para que otros modulos lo usen.
//
// QUE: Declara el BlockchainService como provider (lo crea e inyecta)
//   y lo exporta para que IdeasModule y ArtistsModule puedan usarlo.
//
// COMO: Cuando otro modulo importa BlockchainModule, NestJS le da acceso
//   al BlockchainService. Internamente, NestJS crea UNA sola instancia
//   del servicio (patron Singleton) y la comparte entre todos los que la pidan.

import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
