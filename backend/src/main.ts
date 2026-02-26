import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'https://0xsonata.site',
      credentials: true,
    });

    app.setGlobalPrefix('api');

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port', 3000);

    // Escuchar en 0.0.0.0 permite acceso desde Docker y el proxy
    await app.listen(port, '0.0.0.0');

    const logger = new Logger('Bootstrap');
    logger.log(`0xSonata backend running on http://0.0.0.0:${port}`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('Error crítico al iniciar el backend');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
