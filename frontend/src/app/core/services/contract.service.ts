// POR QUE: Centralizar la interaccion con el contrato SonataNFT.
//   Mint y Verify son operaciones criticas que requieren firma.
//   Tenerlas en un solo lugar evita duplicar la ABI y la logica
//   de creacion del contrato.
//
// QUE: Servicio que crea una instancia de ethers.Contract conectada
//   al signer del usuario, y expone metodos para mint, verify, y consultas.
//
// COMO: ethers.Contract necesita 3 cosas para funcionar:
//   1. La direccion del contrato en la blockchain
//   2. La ABI (lista de funciones y sus parametros)
//   3. Un signer (para operaciones de escritura) o provider (solo lectura)
//   Cuando llamas a contract.mint(hash, uri), ethers:
//   a) Codifica la funcion y parametros en formato ABI (bytes hexadecimales)
//   b) Crea un objeto transaccion {to: contrato, data: bytesABI}
//   c) Pide al signer que firme (popup en wallet)
//   d) Envia la tx firmada al nodo RPC
//   e) Devuelve un objeto TransactionResponse con el hash de la tx

import { Injectable, computed } from '@angular/core';
import { ethers } from 'ethers';
import { WalletService } from './wallet.service';
import { environment } from '../../../environments/environment';

// ABI minima: solo declaramos las funciones que usamos.
// Cada string describe una funcion en formato "human-readable" de ethers.
// "view" = solo lectura (no gasta gas), sin "view" = escritura (gasta gas y necesita firma)
const SONATA_ABI = [
  'function mint(bytes32 audioHash, string uri) external returns (uint256)',
  'function verify(uint256 tokenId) external',
  'function getProof(uint256 tokenId) external view returns (bytes32 audioHash, uint256 timestamp, address creator, uint256 verificationCount)',
  'function isHashRegistered(bytes32 audioHash) external view returns (bool)',
  'function totalSupply() external view returns (uint256)',
  'event SonataMinted(uint256 indexed tokenId, address indexed creator, bytes32 audioHash, uint256 timestamp)',
  'event SonataVerified(uint256 indexed tokenId, address indexed verifier, uint256 newVerificationCount)',
];

// Tipo para los datos de una idea musical (proof)
export interface SonataProof {
  audioHash: string;
  timestamp: number;
  creator: string;
  verificationCount: number;
}

// Tipo para el resultado de un mint exitoso
export interface MintResult {
  txHash: string;
  tokenId: string;
  blockNumber: number;
}

// Tipo para el resultado de un verify exitoso
export interface VerifyResult {
  txHash: string;
  tokenId: number;
  newVerificationCount: string;
  blockNumber: number;
}

@Injectable({ providedIn: 'root' })
export class ContractService {
  // Signal computado que crea la instancia del contrato.
  // Se recalcula automaticamente cuando el signer cambia (conectar/desconectar wallet).
  // Si no hay signer o no hay direccion de contrato, devuelve null.
  readonly contract = computed(() => {
    const signer = this.walletService.signer();
    if (!signer || !environment.contractAddress) {
      return null;
    }
    // Crea una instancia del contrato conectada al signer del usuario
    // Esto permite hacer tanto lecturas (view) como escrituras (mint/verify)
    return new ethers.Contract(environment.contractAddress, SONATA_ABI, signer);
  });

  readonly isReady = computed(() => this.contract() !== null);

  constructor(private readonly walletService: WalletService) {}

  // Verifica si un hash de audio ya fue registrado en el contrato.
  // Util para avisar al usuario ANTES de intentar el mint (evita gastar gas en vano).
  async isHashRegistered(audioHash: string): Promise<boolean> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    console.log('[DEBUG] Verificando si hash ya esta registrado:', audioHash.substring(0, 10) + '...');
    const registered = await c['isHashRegistered'](audioHash);
    console.log('[DEBUG] Hash registrado:', registered);
    return registered as boolean;
  }

  // Registra una nueva idea musical on-chain.
  // Proceso:
  // 1. Llama a contract.mint(hash, uri) que abre popup de firma en la wallet
  // 2. Si el usuario firma, se envia la transaccion a la blockchain
  // 3. Esperamos a que se confirme (se incluya en un bloque)
  // 4. Leemos el evento SonataMinted para obtener el tokenId asignado
  async mint(audioHash: string, uri: string): Promise<MintResult> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    console.log('[DEBUG] Enviando transaccion mint...');
    console.log('[DEBUG]   audioHash:', audioHash.substring(0, 10) + '...');
    console.log('[DEBUG]   uri:', uri);

    // contract.mint() abre popup de firma. Si el usuario rechaza, lanza error.
    // Si acepta, devuelve un TransactionResponse (la tx fue enviada pero no confirmada aun)
    const tx = await c['mint'](audioHash, uri);
    console.log('[DEBUG] Transaccion enviada, hash:', tx.hash);

    // tx.wait() espera a que la transaccion se incluya en un bloque
    // Devuelve el receipt con los logs (eventos emitidos)
    const receipt = await tx.wait();
    console.log('[DEBUG] Transaccion confirmada en bloque:', receipt.blockNumber);

    // Buscamos el evento SonataMinted en los logs del receipt.
    // Los eventos son la forma que tiene el contrato de "avisar" que algo paso.
    // Cada log es un blob binario; contract.interface.parseLog() lo decodifica.
    let tokenId = 'N/A';
    for (let i = 0; i < receipt.logs.length; i++) {
      try {
        const parsed = c.interface.parseLog(receipt.logs[i]);
        if (parsed && parsed.name === 'SonataMinted') {
          tokenId = parsed.args['tokenId'].toString();
          break;
        }
      } catch {
        // Logs de otros contratos (ej: ERC721 Transfer) no parsean con nuestra ABI
      }
    }

    console.log('[DEBUG] Token ID asignado:', tokenId);
    return {
      txHash: receipt.hash,
      tokenId,
      blockNumber: receipt.blockNumber,
    };
  }

  // Verifica la idea de otro artista.
  // Similar a mint pero llama a verify(tokenId) en vez de mint(hash, uri).
  async verify(tokenId: number): Promise<VerifyResult> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    console.log('[DEBUG] Enviando transaccion verify para tokenId:', tokenId);

    const tx = await c['verify'](tokenId);
    console.log('[DEBUG] Transaccion enviada, hash:', tx.hash);

    const receipt = await tx.wait();
    console.log('[DEBUG] Transaccion confirmada en bloque:', receipt.blockNumber);

    // Buscamos el evento SonataVerified
    let newVerificationCount = 'N/A';
    for (let i = 0; i < receipt.logs.length; i++) {
      try {
        const parsed = c.interface.parseLog(receipt.logs[i]);
        if (parsed && parsed.name === 'SonataVerified') {
          newVerificationCount = parsed.args['newVerificationCount'].toString();
          break;
        }
      } catch {
        // Logs de otros contratos
      }
    }

    console.log('[DEBUG] Nuevo conteo de verificaciones:', newVerificationCount);
    return {
      txHash: receipt.hash,
      tokenId,
      newVerificationCount,
      blockNumber: receipt.blockNumber,
    };
  }

  // Obtiene los datos de una idea por tokenId (lectura, no gasta gas)
  async getProof(tokenId: number): Promise<SonataProof> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    const proof = await c['getProof'](tokenId);
    return {
      audioHash: proof[0],
      timestamp: Number(proof[1]),
      creator: proof[2],
      verificationCount: Number(proof[3]),
    };
  }
}
