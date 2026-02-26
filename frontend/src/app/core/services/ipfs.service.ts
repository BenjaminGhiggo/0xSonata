import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IpfsService {
  // Usamos IPFS sin autenticación - los archivos son públicos
  // Para producción con archivos privados, implementar backend proxy
  private readonly uploadEndpoint = 'https://ipfs.io/api/v0/add';
  private readonly gatewayUrl = 'https://ipfs.io/ipfs';

  /**
   * Sube un archivo a IPFS usando el gateway público
   * NOTA: Los archivos son PÚBLICOS y accesibles para cualquiera
   * 
   * @param file Archivo a subir
   * @param stepName Nombre del paso (para logging)
   * @returns Hash CID del archivo subido
   */
  async uploadFile(file: File, stepName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const hash = result.Hash;
      
      console.log(`[IPFS] Archivo subido: ${stepName} -> ${hash}`);
      return hash;
    } catch (error) {
      console.error('[IPFS] Error uploading:', error);
      // Fallamos silenciosamente - el usuario puede continuar sin el archivo
      return '';
    }
  }

  /**
   * Obtiene la URL de IPFS para un hash dado
   */
  getIpfsUrl(hash: string): string {
    return `ipfs://${hash}`;
  }

  /**
   * Obtiene la URL de gateway para visualizar el archivo
   */
  getGatewayUrl(hash: string): string {
    if (!hash) return '';
    return `${this.gatewayUrl}/${hash}`;
  }
}
