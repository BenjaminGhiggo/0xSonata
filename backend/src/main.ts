import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
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

    console.log(`0xSonata backend iniciado correctamente`);
    console.log(`Escuchando en http://0.0.0.0:${port}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(
      `Timestamp (UTC-5): ${new Date().toLocaleString('es-PE', {
        timeZone: 'America/Lima',
      })}`,
    );
  } catch (error) {
    console.error('Error crítico al iniciar el backend');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
