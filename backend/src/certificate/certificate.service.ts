import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockchainService, SonataProof, CreativeStepData } from '../blockchain/blockchain.service';
import PDFDocument from 'pdfkit';

const STEP_LABELS: Record<number, string> = {
  0: 'Prompt Inicial',
  1: 'Variaciones IA',
  2: 'Seleccion Creativa',
  3: 'Edicion DAW',
  4: 'Master Final',
};

const TIER_LABELS: Record<number, string> = {
  0: 'Emergente',
  1: 'Bronce',
  2: 'Plata',
  3: 'Oro',
};

@Injectable()
export class CertificateService {
  constructor(private readonly blockchainService: BlockchainService) {}

  async generatePDF(tokenId: number): Promise<Buffer> {
    let proof: SonataProof;
    try {
      proof = await this.blockchainService.getProof(tokenId);
    } catch {
      throw new NotFoundException(`Token ${tokenId} no encontrado on-chain`);
    }

    let steps: CreativeStepData[] = [];
    try {
      steps = await this.blockchainService.getCreativeSteps(tokenId);
    } catch {
      // Token might not have steps
    }

    let stats;
    try {
      stats = await this.blockchainService.getCreatorStats(proof.creator);
    } catch {
      stats = { totalMints: 0, totalVerificationsGiven: 0, totalVerificationsReceived: 0, tier: 0 };
    }

    return this.buildPDF(tokenId, proof, steps, stats);
  }

  private buildPDF(
    tokenId: number,
    proof: SonataProof,
    steps: CreativeStepData[],
    stats: { tier: number },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('0xSonata', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Creative Evidence Certificate', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text('Certificado de Cadena de Evidencia Creativa', { align: 'center' });
      doc.fillColor('#000');
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#a855f7');
      doc.moveDown(1);

      // Token info
      doc.fontSize(12).font('Helvetica-Bold').text('Informacion del Registro');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Token ID: ${tokenId}`);
      doc.text(`Creador: ${proof.creator}`);
      doc.text(`Tier: ${TIER_LABELS[stats.tier] || 'Emergente'}`);
      doc.text(`Audio Hash: ${proof.audioHash}`);
      doc.text(`Fecha de registro: ${new Date(proof.timestamp * 1000).toISOString()}`);
      doc.text(`Verificaciones recibidas: ${proof.verificationCount}`);
      doc.text(`Pasos documentados: ${proof.stepCount}`);
      doc.moveDown(1);

      // Creative Chain
      if (steps.length > 0) {
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#a855f7');
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text('Cadena de Evidencia Creativa');
        doc.moveDown(0.5);

        steps.forEach((step, i) => {
          const label = STEP_LABELS[step.stepType] || `Paso ${step.stepType}`;
          doc.fontSize(10).font('Helvetica-Bold').text(`${i + 1}. ${label}`);
          doc.fontSize(9).font('Helvetica');
          doc.text(`   Hash: ${step.contentHash}`);
          doc.text(`   Timestamp: ${new Date(step.timestamp * 1000).toISOString()}`);
          if (step.metadata) {
            doc.text(`   Descripcion: ${step.metadata}`);
          }
          doc.moveDown(0.3);
        });
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#a855f7');
      doc.moveDown(1);

      // Verification
      doc.fontSize(10).font('Helvetica');
      doc.text('Red: zkSYS PoB Devnet (Chain ID 57042)');
      doc.text('Explorer: https://explorer-pob.dev11.top');
      doc.text(`Verificar contrato: https://explorer-pob.dev11.top/address/${proof.creator}`);

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999');
      doc.text(
        'Este certificado fue generado por 0xSonata. Los hashes y timestamps son verificables ' +
        'on-chain en la red zkSYS PoB Devnet. Este documento puede presentarse como evidencia ' +
        'de anterioridad y de control creativo humano sobre una obra musical asistida por IA.',
        { align: 'center' },
      );

      doc.text(`Generado: ${new Date().toISOString()}`, { align: 'center' });

      doc.end();
    });
  }
}
