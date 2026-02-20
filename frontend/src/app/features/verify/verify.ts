// POR QUE: La verificacion social complementa el registro de ideas.
//   Cuando otro artista verifica tu idea, incrementa su "credibilidad"
//   on-chain (verificationCount). Es como una firma de testigo.
//
// QUE: Formulario con input de Token ID que llama a verify() en el contrato.
//
// COMO: El usuario ingresa el Token ID (numero) que le compartio el autor.
//   Se envia la transaccion verify(tokenId) que:
//   1. Verifica que el token exista
//   2. Verifica que no seas el creador (no puedes verificar tu propia idea)
//   3. Verifica que no hayas verificado ya
//   4. Incrementa verificationCount y emite evento SonataVerified

import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../core/services/wallet.service';
import { ContractService } from '../../core/services/contract.service';
import { getFriendlyError, EXPLORER_BASE_URL } from '../../shared/utils/error-messages.util';

interface VerifySuccess {
  txHash: string;
  tokenId: number;
  newVerificationCount: string;
}

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <a routerLink="/" class="back-link">&#8592; Volver</a>
      <h1>Verificar idea de otro artista</h1>
      <p class="subtitle">Atestigua que conoces una idea ya registrada (necesitas el Token ID que te hayan pasado).</p>

      @if (!walletService.isConnected()) {
        <div class="card card--muted">
          <p>Conecta tu wallet para verificar ideas.</p>
        </div>
      } @else {
        <div class="card">
          <div class="form-group">
            <label for="tokenIdInput">Token ID de la idea</label>
            <input
              type="number"
              id="tokenIdInput"
              [value]="tokenIdValue()"
              (input)="onTokenIdChange($event)"
              placeholder="Ej: 0, 1, 2..."
              min="0"
              step="1"
              [disabled]="isProcessing()"
            />
            <p class="hint">Numero entero que identifica la idea (lo obtienes al registrarla o te lo comparte el autor).</p>
          </div>

          <div class="form-actions">
            <button
              class="btn btn-primary btn-large"
              (click)="handleVerify()"
              [disabled]="tokenIdValue() === '' || isProcessing()"
            >
              {{ isProcessing() ? 'Procesando...' : 'Verificar idea' }}
            </button>
            <button class="btn btn-secondary" (click)="handleClear()" [disabled]="isProcessing()">
              Limpiar
            </button>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">
            <p>{{ errorMessage() }}</p>
          </div>
        }

        @if (result()) {
          <div class="alert alert-success">
            <p>Idea verificada correctamente.</p>
            <p>Nuevo conteo de verificaciones: <strong>{{ result()!.newVerificationCount }}</strong></p>
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
    .form-group input {
      width: 100%; padding: 12px; border: 1px solid rgba(148,163,184,0.5);
      border-radius: 8px; font-size: 0.95rem;
    }
    .form-group input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
    .hint { font-size: 0.85rem; color: #6b7280; margin-top: 6px; }
    .form-actions { display: flex; gap: 12px; }
    .form-actions .btn-primary { flex: 1; }
    .alert { margin-top: 16px; padding: 16px; border-radius: 8px; border: 1px solid; }
    .alert-success { background: rgba(16,185,129,0.1); border-color: #16a34a; color: #16a34a; }
    .alert-error { background: rgba(239,68,68,0.1); border-color: #dc2626; color: #dc2626; }
    .alert p { margin-bottom: 8px; }
    .explorer-link { color: #f59e0b; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 8px; }
    .explorer-link:hover { text-decoration: underline; }
  `]
})
export class Verify {
  readonly explorerBaseUrl = EXPLORER_BASE_URL;

  readonly tokenIdValue = signal('');
  readonly isProcessing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<VerifySuccess | null>(null);

  constructor(
    readonly walletService: WalletService,
    private readonly contractService: ContractService,
  ) {}

  onTokenIdChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tokenIdValue.set(input.value);
  }

  async handleVerify(): Promise<void> {
    const trimmed = this.tokenIdValue().trim();
    if (!trimmed) {
      this.errorMessage.set('Escribe el Token ID de la idea que quieres verificar (ej: 0, 1, 2).');
      return;
    }

    // Convertir string a numero entero
    const tokenId = parseInt(trimmed, 10);
    if (isNaN(tokenId) || tokenId < 0) {
      this.errorMessage.set('Token ID debe ser un numero entero mayor o igual a 0.');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    try {
      console.log('[DEBUG] Verificando idea con tokenId:', tokenId);
      const verifyResult = await this.contractService.verify(tokenId);

      this.result.set({
        txHash: verifyResult.txHash,
        tokenId: verifyResult.tokenId,
        newVerificationCount: verifyResult.newVerificationCount,
      });

      this.tokenIdValue.set('');
      console.log('[DEBUG] Verificacion exitosa');
    } catch (err: unknown) {
      console.log('[ERROR] Error en verify:', err);
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.isProcessing.set(false);
    }
  }

  handleClear(): void {
    this.tokenIdValue.set('');
    this.errorMessage.set(null);
    this.result.set(null);
  }
}
