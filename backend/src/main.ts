// POR QUE: Este es el punto de entrada de la aplicacion NestJS.
//   Necesitamos hacer 3 cosas al arrancar:
//   1. Habilitar CORS para que el frontend (puerto 4200) pueda hacer peticiones
//   2. Agregar el prefijo /api a todas las rutas (ej: /api/ideas/0)
//   3. Leer el puerto desde la configuracion del entorno
//
// QUE: Crea la app NestJS, la configura y la pone a escuchar.
//
// COMO: NestFactory.create() toma el modulo raiz (AppModule) y construye
//   toda la jerarquia de modulos, controladores y servicios.
//   Luego aplicamos la configuracion y arrancamos el servidor HTTP.

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: permite que el frontend Angular (localhost:4200) haga peticiones
  // Sin esto, el navegador bloquea las peticiones entre puertos distintos
  app.enableCors();

  // Prefijo global: todas las rutas empiezan con /api
  // Ejemplo: IdeasController con @Get(':tokenId') -> GET /api/ideas/:tokenId
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);

  await app.listen(port);
  console.log(`[DEBUG] 0xSonata backend escuchando en http://localhost:${port}`);
  console.log(`[DEBUG] RPC_URL: ${configService.get<string>('rpcUrl')}`);
  console.log(`[DEBUG] SONATA_NFT_ADDRESS: ${configService.get<string>('sonataNftAddress') || '(no configurada)'}`);
}
bootstrap();
