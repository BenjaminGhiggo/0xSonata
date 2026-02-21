import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { Idea, CreativeStep } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Idea, CreativeStep]), BlockchainModule],
  controllers: [CertificateController],
  providers: [CertificateService],
})
export class CertificateModule {}
