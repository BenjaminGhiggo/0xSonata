import { Injectable, computed } from '@angular/core';
import { ethers } from 'ethers';
import { WalletService } from './wallet.service';
import { environment } from '../../../environments/environment';

const SONATA_ABI = [
  // Funciones principales
  'function mint(bytes32 audioHash, string uri) external returns (uint256)',
  'function verify(uint256 tokenId) external',
  'function getProof(uint256 tokenId) external view returns (bytes32 audioHash, uint256 timestamp, address creator, uint256 verificationCount, uint256 stepCount)',
  'function isHashRegistered(bytes32 audioHash) external view returns (bool)',
  'function totalSupply() external view returns (uint256)',
  'function addStep(uint256 tokenId, bytes32 contentHash, uint8 stepType, string metadata) external',
  'function getCreativeSteps(uint256 tokenId) external view returns (tuple(bytes32 contentHash, uint8 stepType, uint256 timestamp, string metadata)[])',
  'function deposit() external payable',
  'function withdraw(uint256 amount) external',
  'function stakeBalance(address) external view returns (uint256)',
  'function getTier(address creator) external view returns (uint8)',
  'function getCreatorStats(address creator) external view returns (uint256 totalMints, uint256 totalVerificationsGiven, uint256 totalVerificationsReceived, uint8 tier)',
  'function getVerificationWeight(address verifier) external view returns (uint256)',
  'function MIN_STAKE() external view returns (uint256)',

  // Eventos personalizados del contrato
  'event SonataMinted(uint256 indexed tokenId, address indexed creator, bytes32 audioHash, uint256 timestamp)',
  'event SonataVerified(uint256 indexed tokenId, address indexed verifier, uint256 newVerificationCount)',
  'event StepAdded(uint256 indexed tokenId, uint8 stepType, bytes32 contentHash)',
  'event StakeDeposited(address indexed user, uint256 amount)',
  'event StakeWithdrawn(address indexed user, uint256 amount)',

  // Eventos ERC721 (siempre se emiten en un mint)
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
];

export interface SonataProof {
  audioHash: string;
  timestamp: number;
  creator: string;
  verificationCount: number;
  stepCount: number;
}

export interface MintResult {
  txHash: string;
  tokenId: string;
  blockNumber: number;
}

export interface VerifyResult {
  txHash: string;
  tokenId: number;
  newVerificationCount: string;
  blockNumber: number;
}

export interface CreativeStepData {
  contentHash: string;
  stepType: number;
  timestamp: number;
  metadata: string;
}

export interface StepContent {
  prompt?: string;
  platform?: string;
  description?: string;
  reason?: string;
  edits?: string[];
  daw?: string;
  specs?: string;
  screenshotHash?: string;
  audioHash?: string;
  projectHash?: string;
  masterHash?: string;
}

export const STEP_TYPES = [
  { id: 0, label: 'Prompt Inicial', description: 'Texto/instruccion usada para generar con IA (Suno, Udio, etc.)' },
  { id: 1, label: 'Variacion IA', description: 'Resultado generado por la herramienta de IA' },
  { id: 2, label: 'Seleccion Creativa', description: 'La variacion elegida por el artista' },
  { id: 3, label: 'Edicion DAW', description: 'Edicion en Ableton, FL Studio, Logic, etc.' },
  { id: 4, label: 'Master Final', description: 'Version final masterizada lista para publicar' },
];

@Injectable({ providedIn: 'root' })
export class ContractService {
  readonly contract = computed(() => {
    const signer = this.walletService.signer();
    if (!signer || !environment.contractAddress) return null;
    return new ethers.Contract(environment.contractAddress, SONATA_ABI, signer);
  });

  readonly isReady = computed(() => this.contract() !== null);

  constructor(private readonly walletService: WalletService) { }

  async isHashRegistered(audioHash: string): Promise<boolean> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');
    return (await c['isHashRegistered'](audioHash)) as boolean;
  }

  async mint(audioHash: string, uri: string): Promise<MintResult> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    const tx = await c['mint'](audioHash, uri);


    // Usar provider.getTransactionReceipt para obtener todos los logs
    const provider = c.runner?.provider;
    if (!provider) {
      throw new Error('Provider no disponible');
    }


    const receipt = await provider.getTransactionReceipt(tx.hash);

    if (!receipt) {

      throw new Error('No se pudo obtener el receipt. Intenta de nuevo.');
    }



    let tokenId = 'N/A';
    const contractAddress = environment.contractAddress?.toLowerCase();



    // Método 1: Filtrar logs por contrato y parsear
    for (const log of receipt.logs) {
      // Solo procesar logs de nuestro contrato
      if (log.address?.toLowerCase() !== contractAddress) {
        continue;
      }

      try {
        // En ethers v6, parseLog recibe el log object completo directamente
        const parsed = c.interface.parseLog(log);



        if (parsed?.name === 'SonataMinted') {
          tokenId = parsed.args[0]?.toString() || parsed.args['tokenId']?.toString();

          break;
        }

        // Fallback: usar evento Transfer de ERC721 (siempre se emite en un mint)
        if (parsed?.name === 'Transfer' && parsed.args['to']?.toLowerCase() === this.walletService.account()?.toLowerCase()) {
          tokenId = parsed.args['tokenId']?.toString();

          break;
        }
      } catch (parseErr: any) {

      }
    }

    // Método 2: Extraer directamente de topics si parseLog falla
    if (tokenId === 'N/A') {

      const eventSignature = ethers.id('SonataMinted(uint256,address,bytes32,uint256)');


      for (const log of receipt.logs) {
        if (log.address?.toLowerCase() !== contractAddress) {
          continue;
        }



        if (log.topics && log.topics[0] === eventSignature) {
          // tokenId está en topics[1] (primer parámetro indexed, 32 bytes)
          tokenId = BigInt(log.topics[1]).toString();

          break;
        }
      }
    }



    if (tokenId === 'N/A') {

    }

    return { txHash: receipt.hash, tokenId, blockNumber: receipt.blockNumber };
  }

  async addStep(tokenId: number, contentHash: string, stepType: number, content: StepContent): Promise<string> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    // Crear metadata con el contenido completo
    const metadata = JSON.stringify({
      step: STEP_TYPES.find(s => s.id === stepType)?.label || 'Unknown',
      timestamp: new Date().toISOString(),
      content: content
    });

    const tx = await c['addStep'](tokenId, contentHash, stepType, metadata);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getCreativeSteps(tokenId: number): Promise<CreativeStepData[]> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');
    const steps = await c['getCreativeSteps'](tokenId);
    return steps.map((s: [string, number, bigint, string]) => ({
      contentHash: s[0],
      stepType: Number(s[1]),
      timestamp: Number(s[2]),
      metadata: s[3],
    }));
  }

  async deposit(amountEther: string): Promise<string> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');
    const tx = await c['deposit']({ value: ethers.parseEther(amountEther) });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getStakeBalance(address: string): Promise<string> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');
    const balance = await c['stakeBalance'](address);
    return ethers.formatEther(balance);
  }

  async verify(tokenId: number): Promise<VerifyResult> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    const tx = await c['verify'](tokenId);
    const receipt = await tx.wait();

    let newVerificationCount = 'N/A';
    for (const log of receipt.logs) {
      try {
        const parsed = c.interface.parseLog(log);
        if (parsed?.name === 'SonataVerified') {
          newVerificationCount = parsed.args[2].toString();
          break;
        }
      } catch { /* skip */ }
    }

    return { txHash: receipt.hash, tokenId, newVerificationCount, blockNumber: receipt.blockNumber };
  }

  async getProof(tokenId: number): Promise<SonataProof> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');
    const proof = await c['getProof'](tokenId);
    return {
      audioHash: proof[0],
      timestamp: Number(proof[1]),
      creator: proof[2],
      verificationCount: Number(proof[3]),
      stepCount: Number(proof[4]),
    };
  }

  async getTier(address: string): Promise<number> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');
    return Number(await c['getTier'](address));
  }

  async getCreatorStats(address: string): Promise<{ totalMints: number; totalVerificationsGiven: number; totalVerificationsReceived: number; tier: number }> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');
    const stats = await c['getCreatorStats'](address);
    return {
      totalMints: Number(stats[0]),
      totalVerificationsGiven: Number(stats[1]),
      totalVerificationsReceived: Number(stats[2]),
      tier: Number(stats[3]),
    };
  }

  /**
   * Busca todos los Token IDs minteados por una dirección específica
   * usando el evento SonataMinted.
   */
  async findTokenIdsByOwner(address: string): Promise<string[]> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    try {
      // Filtrar eventos SonataMinted donde creator == address
      // El segundo parámetro indexed es el creator
      const filter = {
        address: environment.contractAddress,
        topics: [
          ethers.id('SonataMinted(uint256,address,bytes32,uint256)'),
          null, // tokenId (any)
          ethers.zeroPadValue(address.toLowerCase(), 32), // creator address indexed
        ],
      };

      const provider = c.runner as ethers.Provider;
      const events = await provider.getLogs(filter);

      const tokenIds: string[] = [];
      for (const log of events) {
        try {
          const parsed = c.interface.parseLog(log);
          if (parsed?.name === 'SonataMinted') {
            tokenIds.push(parsed.args[0].toString());
          }
        } catch {
          // Skip logs que no se pueden parsear
        }
      }
      return tokenIds;
    } catch (error) {

      return [];
    }
  }

  /**
   * Busca el Token ID por audio hash específico
   */
  async findTokenIdByAudioHash(audioHash: string, ownerAddress: string): Promise<string | null> {
    const c = this.contract();
    if (!c) throw new Error('Contrato no disponible. Conecta tu wallet.');

    const tokenIds = await this.findTokenIdsByOwner(ownerAddress);

    for (const tokenId of tokenIds) {
      try {
        const proof = await c['getProof'](parseInt(tokenId));
        if (proof.audioHash.toLowerCase() === audioHash.toLowerCase()) {
          return tokenId;
        }
      } catch {
        // Token no existe o error
      }
    }
    return null;
  }
}
