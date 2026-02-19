// POR QUE: Este es el modulo raiz que conecta todos los demas modulos.
//   NestJS necesita un modulo central que le diga: "estos son los modulos
//   que forman la aplicacion". Es como un indice de un libro.
//
// QUE: Importa ConfigModule (para leer .env) y los modulos de negocio.
//
// COMO: El decorador @Module le dice a NestJS que esta clase es un modulo.
//   'imports' lista los modulos que este modulo necesita.
//   ConfigModule.forRoot() lee el .env al arrancar y lo deja disponible
//   para toda la aplicacion (isGlobal: true).

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig from './config/env.config';
import { AppController } from './app.controller';
import { BlockchainModule } from './blockchain/blockchain.module';
import { IdeasModule } from './ideas/ideas.module';
import { ArtistsModule } from './artists/artists.module';

@Module({
  imports: [
    // ConfigModule.forRoot() hace 2 cosas:
    // 1. Lee el archivo .env y pone los valores en process.env
    // 2. Ejecuta la funcion 'load' (envConfig) para estructurar los valores
    // isGlobal: true hace que ConfigService este disponible en TODOS los modulos
    // sin tener que importar ConfigModule en cada uno
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    BlockchainModule,
    IdeasModule,
    ArtistsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
