// POR QUE: La funcion principal de 0xSonata es registrar ideas musicales.
//   Este componente es la "ventanilla de registro" donde el artista:
//   1. Sube su archivo de audio
//   2. Ve la huella (hash) calculada automaticamente
//   3. Firma la transaccion de mint
//   4. Recibe su Token ID como prueba
//
// QUE: Formulario con upload de audio, calculo de hash SHA-256,
//   verificacion de duplicados, y mint on-chain.
//
// COMO: Usa signals para manejar el estado local del formulario.
//   El flujo completo es:
//   1. Usuario selecciona archivo -> handleFileChange()
//   2. Se calcula hash SHA-256 en el navegador -> calculateFileHash()
//   3. Se verifica si ya esta registrado -> contractService.isHashRegistered()
//   4. Si no esta registrado, el usuario puede hacer mint
//   5. mint() abre popup de firma en la wallet -> contractService.mint()
//   6. Se espera confirmacion y se muestra resultado

import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../core/services/wallet.service';
import { ContractService } from '../../core/services/contract.service';
import { calculateFileHash } from '../../shared/utils/hash.util';
import { getFriendlyError, EXPLORER_BASE_URL } from '../../shared/utils/error-messages.util';

const MAX_FILE_MB = 10;

// Tipo para el resultado exitoso de mint
interface MintSuccess {
  type: 'success';
  txHash: string;
  tokenId: string;
  blockNumber: number;
}

@Component({
  selector: 'app-mint',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <a routerLink="/" class="back-link">&#8592; Volver</a>
      <h1>Registrar nueva idea</h1>
      <p class="subtitle">Sube un audio corto (beat, melodia, loop, tarareo) y registralo on-chain.</p>

      @if (!walletService.isConnected()) {
        <div class="card card--muted">
          <p>Conecta tu wallet para poder registrar ideas.</p>
        </div>
      } @else {
        <div class="card">
          <!-- Paso 1: Seleccionar archivo de audio -->
          <div class="form-group">
            <label for="audioFile">Archivo de audio</label>
            <input
              type="file"
              id="audioFile"
              accept="audio/*"
              (change)="handleFileChange($event)"
              [disabled]="isProcessing()"
            />
            <p class="hint">Max. {{ maxFileMB }} MB. Formatos: MP3, WAV, OGG.</p>

            @if (fileName()) {
              <p class="file-info">{{ fileName() }} ({{ fileSizeKB() }} KB)</p>
            }
          </div>

          <!-- Paso 2: Mostrar hash calculado -->
          @if (audioHash()) {
            <div class="form-group">
              <label>Huella del audio (calculada automaticamente)</label>
              <input type="text" [value]="audioHash()" readonly class="hash-input" />
            </div>
          }

          <!-- Paso 3: Token URI (opcional) -->
          <div class="form-group">
            <label for="uriInput">Token URI <span class="optional">(opcional)</span></label>
            <input
              type="text"
              id="uriInput"
              [value]="tokenUri()"
              (input)="onUriChange($event)"
              placeholder="ipfs://... o dejalo vacio para demo"
              [disabled]="isProcessing()"
            />
          </div>

          <!-- Estado actual del proceso -->
          @if (statusMessage()) {
            <p class="status-message">{{ statusMessage() }}</p>
          }

          <!-- Botones -->
          <div class="form-actions">
            <button
              class="btn btn-primary btn-large"
              (click)="handleMint()"
              [disabled]="!audioHash() || isProcessing()"
            >
              {{ isProcessing() ? statusMessage() || 'Procesando...' : 'Registrar idea' }}
            </button>
            <button class="btn btn-secondary" (click)="handleClear()" [disabled]="isProcessing()">
              Limpiar
            </button>
          </div>
        </div>

        <!-- Mensaje de error -->
        @if (errorMessage()) {
          <div class="alert alert-error">
            <p>{{ errorMessage() }}</p>
          </div>
        }

        <!-- Resultado exitoso -->
        @if (result()) {
          <div class="alert alert-success">
            <p>Idea registrada correctamente.</p>
            @if (result()!.tokenId !== 'N/A') {
              <p class="token-id">Token ID: <strong>{{ result()!.tokenId }}</strong> (guardalo para verificar despues)</p>
            }
            <a
              [href]="explorerBaseUrl + '/tx/' + result()!.txHash"
              target="_blank"
              rel="noopener noreferrer"
              class="explorer-link"
            >
              Ver en Explorer
            </a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .back-link { color: #6b7280; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-bottom: 16px; }
    .back-link:hover { color: #f59e0b; }
    h1 { margin-bottom: 8px; }
    .subtitle { color: #6b7280; margin-bottom: 24px; }
    .card {
      background: #fff; border: 1px solid rgba(148,163,184,0.5); border-radius: 14px;
      padding: 24px; box-shadow: 0 4px 12px rgba(148,163,184,0.2);
    }
    .card--muted { opacity: 0.6; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: #374151; font-weight: 500; font-size: 0.9rem; }
    .form-group input[type="file"],
    .form-group input[type="text"] {
      width: 100%; padding: 12px; border: 1px solid rgba(148,163,184,0.5);
      border-radius: 8px; font-size: 0.95rem;
    }
    .form-group input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    .hint { font-size: 0.85rem; color: #6b7280; margin-top: 6px; }
    .optional { font-weight: normal; color: #6b7280; }
    .file-info { margin-top: 8px; font-size: 0.85rem; color: #6b7280; }
    .hash-input { font-family: 'Courier New', monospace; font-size: 0.85rem; }
    .form-actions { display: flex; gap: 12px; margin-top: 20px; }
    .form-actions .btn-primary { flex: 1; }
    .status-message { color: #f59e0b; font-size: 0.9rem; margin: 12px 0; }
    .alert { margin-top: 16px; padding: 16px; border-radius: 8px; border: 1px solid; }
    .alert-success { background: rgba(16,185,129,0.1); border-color: #16a34a; color: #16a34a; }
    .alert-error { background: rgba(239,68,68,0.1); border-color: #dc2626; color: #dc2626; }
    .alert p { margin-bottom: 8px; }
    .token-id { font-size: 0.9rem; }
    .explorer-link { color: #f59e0b; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 8px; }
    .explorer-link:hover { text-decoration: underline; }
  `]
})
export class Mint {
  readonly maxFileMB = MAX_FILE_MB;
  readonly explorerBaseUrl = EXPLORER_BASE_URL;

  // Signals locales para el estado del formulario
  readonly fileName = signal('');
  readonly fileSizeKB = signal('');
  readonly audioHash = signal('');
  readonly tokenUri = signal('');
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<MintSuccess | null>(null);
  readonly isProcessing = signal(false);

  constructor(
    readonly walletService: WalletService,
    private readonly contractService: ContractService,
  ) {}

  onUriChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tokenUri.set(input.value);
  }

  // Se ejecuta cuando el usuario selecciona un archivo de audio
  async handleFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Limpiar estado anterior
    this.errorMessage.set(null);
    this.result.set(null);
    this.audioHash.set('');

    // Validar tamano del archivo
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      this.errorMessage.set(`El archivo es muy grande (${sizeMB.toFixed(1)} MB). Usa un audio de hasta ${MAX_FILE_MB} MB.`);
      return;
    }

    // Validar que sea un archivo de audio
    const type = file.type?.toLowerCase() || '';
    const isAudio = type.startsWith('audio/');
    if (!isAudio && !file.name.match(/\.(mp3|wav|ogg|webm|flac|aac|m4a)$/i)) {
      this.errorMessage.set('Por favor elige un archivo de audio (MP3, WAV, OGG, etc.).');
      return;
    }

    this.fileName.set(file.name);
    this.fileSizeKB.set((file.size / 1024).toFixed(2));

    // Calcular hash SHA-256 del audio
    try {
      this.statusMessage.set('Calculando huella del audio...');
      this.isProcessing.set(true);
      const hash = await calculateFileHash(file);
      this.audioHash.set(hash);
      console.log('[DEBUG] Hash calculado exitosamente');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('[ERROR] Error calculando hash:', message);
      this.errorMessage.set('No se pudo procesar el archivo. Prueba con otro formato de audio.');
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  // Ejecuta el mint: verifica duplicado y envia la transaccion
  async handleMint(): Promise<void> {
    const hash = this.audioHash();
    if (!hash) return;

    this.errorMessage.set(null);
    this.result.set(null);
    this.isProcessing.set(true);

    try {
      // Paso 1: Verificar si el hash ya esta registrado
      this.statusMessage.set('Verificando si el audio ya esta registrado...');
      const alreadyRegistered = await this.contractService.isHashRegistered(hash);
      if (alreadyRegistered) {
        this.errorMessage.set('Este audio ya fue registrado on-chain. Elige otro archivo u otra idea.');
        return;
      }

      // Paso 2: Enviar transaccion de mint
      this.statusMessage.set('Firmando en tu wallet...');
      const uri = this.tokenUri().trim() || 'ipfs://demo/0xsonata/' + Date.now();
      const mintResult = await this.contractService.mint(hash, uri);

      // Paso 3: Mostrar resultado
      this.result.set({
        type: 'success',
        txHash: mintResult.txHash,
        tokenId: mintResult.tokenId,
        blockNumber: mintResult.blockNumber,
      });

      // Limpiar formulario
      this.audioHash.set('');
      this.fileName.set('');
      this.fileSizeKB.set('');
      this.tokenUri.set('');

      console.log('[DEBUG] Mint exitoso. Token ID:', mintResult.tokenId);
    } catch (err: unknown) {
      console.log('[ERROR] Error en mint:', err);
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  handleClear(): void {
    this.fileName.set('');
    this.fileSizeKB.set('');
    this.audioHash.set('');
    this.tokenUri.set('');
    this.errorMessage.set(null);
    this.result.set(null);
  }
}
