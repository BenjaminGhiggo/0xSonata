import { Controller, Get, Param, Res, ParseIntPipe } from '@nestjs/common';
import type { Response } from 'express';
import { CertificateService } from './certificate.service';

@Controller('certificate')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get(':tokenId')
  async getCertificate(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @Res() res: Response,
  ) {
    const pdf = await this.certificateService.generatePDF(tokenId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=0xSonata-Certificate-${tokenId}.pdf`,
      'Content-Length': pdf.length,
    });

    res.end(pdf);
  }
}
