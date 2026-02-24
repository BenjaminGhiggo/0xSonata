import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import envConfig from './config/env.config';
import { AppController } from './app.controller';
import { BlockchainModule } from './blockchain/blockchain.module';
import { IdeasModule } from './ideas/ideas.module';
import { ArtistsModule } from './artists/artists.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { CertificateModule } from './certificate/certificate.module';
import { Artist, Idea, CreativeStep } from './database/entities';
import { SeedService } from './database/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('database.host') || 'localhost',
        port: configService.get<number>('database.port') || 5432,
        username: configService.get<string>('database.username') || 'postgres',
        password: configService.get<string>('database.password') || 'postgres',
        database: configService.get<string>('database.name') || '0xsonata',
        entities: [Artist, Idea, CreativeStep],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Artist, Idea, CreativeStep]),
    BlockchainModule,
    IdeasModule,
    ArtistsModule,
    LeaderboardModule,
    CertificateModule,
  ],
  controllers: [AppController],
  providers: [SeedService],
})
export class AppModule {}
