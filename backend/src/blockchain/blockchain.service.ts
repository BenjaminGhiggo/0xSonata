// POR QUE: Todos los endpoints necesitan leer datos del contrato SonataNFT.
//   Este servicio centraliza la conexion para no crear multiples conexiones
//   al nodo RPC (cada conexion consume red y memoria).
//
// QUE: Servicio que conecta a la blockchain y expone funciones de lectura:
//   - getProof(tokenId): datos de una idea musical registrada
//   - getCreatorStats(address): cuantas ideas registro y cuantas verifico
//   - getTotalSupply(): cuantas ideas existen en total
//   - getIdeasByCreator(address): lista de todas las ideas de un artista
//
// COMO: ethers.JsonRpcProvider envia peticiones HTTP POST al nodo RPC.
//   Por ejemplo, cuando llamas a contract.totalSupply(), ethers:
//   1. Codifica la llamada en formato ABI (un string hexadecimal)
//   2. Envia un POST al RPC con metodo "eth_call" y los datos codificados
//   3. Recibe la respuesta hexadecimal y la decodifica al tipo esperado (uint256)

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

// ABI minima: solo las funciones de lectura que necesitamos.
// Cada string describe una funcion del contrato en formato "human-readable".
// ethers.js la convierte internamente en el formato binario ABI que entiende la EVM.
const SONATA_ABI = [
  'function totalSupply() view returns (uint256)',
  'function getCreatorStats(address creator) view returns (uint256 totalMints, uint256 totalVerificationsGiven)',
  'function getProof(uint256 tokenId) view returns (tuple(bytes32 audioHash, uint256 timestamp, address creator, uint256 verificationCount))',
  'function isHashRegistered(bytes32 audioHash) view returns (bool)',
];

// Tipo que representa los datos de una idea musical (Sonata Proof)
export interface SonataProof {
  audioHash: string;
  timestamp: number;
  creator: string;
  verificationCount: number;
}

// Tipo para las estadisticas de un artista
export interface CreatorStats {
  totalMints: number;
  totalVerificationsGiven: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider!: ethers.JsonRpcProvider;
  private contract!: ethers.Contract;
  private isReady = false;

  constructor(private readonly configService: ConfigService) {}

  // OnModuleInit: NestJS llama a este metodo automaticamente cuando el modulo
  // se inicializa. Es el momento ideal para conectarse a la blockchain.
  onModuleInit(): void {
    const rpcUrl = this.configService.get<string>('rpcUrl', '');
    const contractAddress = this.configService.get<string>('sonataNftAddress', '');

    if (!rpcUrl) {
      this.logger.error('RPC_URL no configurada en .env. El backend no puede conectar a la blockchain.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (contractAddress) {
      this.contract = new ethers.Contract(contractAddress, SONATA_ABI, this.provider);
      this.isReady = true;
      this.logger.log(`Conectado a SonataNFT en ${contractAddress} via ${rpcUrl}`);
    } else {
      this.logger.warn('SONATA_NFT_ADDRESS no configurada en .env. Endpoints de blockchain no funcionaran.');
    }
  }

  // Verifica si el servicio esta listo para hacer consultas
  private ensureReady(): void {
    if (!this.isReady) {
      throw new Error('BlockchainService no esta listo. Configura SONATA_NFT_ADDRESS en .env');
    }
  }

  // Obtiene los datos de una idea musical por su tokenId
  async getProof(tokenId: number): Promise<SonataProof> {
    this.ensureReady();
    this.logger.debug(`getProof(${tokenId}) - consultando contrato...`);

    // contract.getProof() traduce la llamada a una peticion eth_call al nodo RPC
    // El nodo ejecuta la funcion view del contrato (sin gastar gas) y devuelve el resultado
    const proof = await this.contract.getProof(tokenId);

    // proof es un array-like que ethers devuelve con propiedades nombradas
    // Convertimos a un objeto simple para mayor claridad
    const result: SonataProof = {
      audioHash: proof.audioHash,
      timestamp: Number(proof.timestamp),
      creator: proof.creator,
      verificationCount: Number(proof.verificationCount),
    };

    this.logger.debug(`getProof(${tokenId}) -> creator: ${result.creator}, verifications: ${result.verificationCount}`);
    return result;
  }

  // Obtiene las estadisticas de un artista (cuantas ideas registro, cuantas verifico)
  async getCreatorStats(address: string): Promise<CreatorStats> {
    this.ensureReady();
    this.logger.debug(`getCreatorStats(${address}) - consultando contrato...`);

    // Devuelve un array de 2 BigInt: [totalMints, totalVerificationsGiven]
    // Number() convierte BigInt a number (seguro porque estos valores son pequenos)
    const [totalMints, totalVerificationsGiven] = await this.contract.getCreatorStats(address);

    const result: CreatorStats = {
      totalMints: Number(totalMints),
      totalVerificationsGiven: Number(totalVerificationsGiven),
    };

    this.logger.debug(`getCreatorStats(${address}) -> mints: ${result.totalMints}, verifications: ${result.totalVerificationsGiven}`);
    return result;
  }

  // Cuantas ideas musicales existen en total registradas en el contrato
  async getTotalSupply(): Promise<number> {
    this.ensureReady();
    const total = await this.contract.totalSupply();
    return Number(total);
  }

  // Obtiene TODAS las ideas de un artista especifico.
  // Recorre todos los tokens y filtra por creator.
  // NOTA: Este enfoque es simple pero lento si hay muchos tokens.
  //   En produccion usariamos un indexador (subgraph) en lugar de iterar.
  async getIdeasByCreator(address: string): Promise<Array<SonataProof & { tokenId: number }>> {
    this.ensureReady();
    this.logger.debug(`getIdeasByCreator(${address}) - buscando ideas...`);

    const totalSupply = await this.getTotalSupply();
    const ideas: Array<SonataProof & { tokenId: number }> = [];

    // Iteramos cada tokenId desde 0 hasta totalSupply-1
    // Para cada uno, pedimos el proof y verificamos si el creator coincide
    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        const proof = await this.getProof(tokenId);
        if (proof.creator.toLowerCase() === address.toLowerCase()) {
          ideas.push({ tokenId, ...proof });
        }
      } catch {
        // Si un tokenId no existe o da error, lo saltamos
        this.logger.debug(`Token ${tokenId} no accesible, saltando`);
      }
    }

    this.logger.debug(`getIdeasByCreator(${address}) -> encontradas ${ideas.length} ideas`);
    return ideas;
  }
}
