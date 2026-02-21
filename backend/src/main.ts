import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: permite que el frontend Angular (localhost:4200) haga peticiones
  // Sin esto, el navegador bloquea las peticiones entre puertos distintos
  app.enableCors({ origin: process.env.CORS_ORIGIN || 'https://0xsonata.site', credentials: true });

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);

  await app.listen(port);
  console.log(`0xSonata backend en http://localhost:${port}`);
}
bootstrap();
