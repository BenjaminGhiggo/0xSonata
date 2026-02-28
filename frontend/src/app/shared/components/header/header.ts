// POR QUE: El header es la barra superior visible en toda la app.
//   El usuario siempre necesita saber: estoy conectado?, en que red?, con que cuenta?
//   Y debe poder conectar/desconectar desde cualquier pagina.
//
// QUE: Componente standalone que muestra:
//   - Logo 0xSonata
//   - Estado de la wallet (conectado/desconectado)
//   - Boton conectar/desconectar
//
// COMO: Inyecta WalletService y lee sus signals.
//   Los signals se actualizan automaticamente cuando el estado cambia.
//   @if es la nueva sintaxis condicional de Angular 17+ (reemplaza *ngIf).

import { Component } from '@angular/core';
import { WalletService } from '../../../core/services/wallet.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">&#119070;</span>
          <span class="logo-text">0xSonata</span>
        </div>
        <p class="tagline">Registra y protege tus ideas musicales on-chain</p>
      </div>

      <div class="wallet-section">
        <!-- Si no tiene wallet instalada -->
        @if (!walletService.hasWallet) {
          <div class="wallet-status wallet-status--error">
            <p>Necesitas <a href="https://paliwallet.com/" target="_blank" rel="noopener noreferrer">Pali Wallet</a> instalada</p>
          </div>
        }

        <!-- Si no esta conectado -->
        @if (walletService.hasWallet && !walletService.isConnected()) {
          <button class="btn btn-primary" (click)="walletService.connect()" [disabled]="walletService.isConnecting()">
            {{ walletService.isConnecting() ? 'Conectando...' : 'Conectar wallet' }}
          </button>
          @if (walletService.error()) {
            <p class="error-text">{{ walletService.error() }}</p>
          }
        }

        <!-- Si esta conectado -->
        @if (walletService.isConnected()) {
          <div class="wallet-info">
            <span class="wallet-address">{{ shortAddress() }}</span>
            <span class="wallet-network" [class.wrong-network]="walletService.chainId() !== expectedChainId">
              {{ walletService.chainId() === expectedChainId ? 'zkSYS PoB Devnet' : 'Red incorrecta' }}
            </span>
            <button class="btn btn-secondary btn-sm" (click)="walletService.disconnect()">Desconectar</button>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: #fff;
      border-bottom: 1px solid rgba(148, 163, 184, 0.4);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(148, 163, 184, 0.2);
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 1.8rem;
      font-weight: 700;
    }
    .logo-icon {
      font-size: 2.2rem;
      background: linear-gradient(135deg, #ef4444, #ec4899, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-text {
      background: linear-gradient(135deg, #ef4444, #ec4899, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 0.04em;
    }
    .tagline {
      color: #6b7280;
      font-size: 0.9rem;
      margin-top: 2px;
    }
    .wallet-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .wallet-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    .wallet-address {
      font-family: 'Courier New', monospace;
      color: #f59e0b;
      font-weight: 600;
    }
    .wallet-network {
      color: #16a34a;
      font-size: 0.85rem;
    }
    .wrong-network {
      color: #ea580c;
    }
    .wallet-status--error {
      color: #dc2626;
      font-size: 0.9rem;
    }
    .wallet-status--error a {
      color: #f59e0b;
    }
    .error-text {
      color: #dc2626;
      font-size: 0.85rem;
    }
    @media (max-width: 640px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class Header {
  readonly expectedChainId = environment.chainId;

  constructor(readonly walletService: WalletService) {}

  // Acorta la direccion para mostrarla (0x1234...abcd)
  shortAddress(): string {
    const account = this.walletService.account();
    if (!account) return '';
    return account.substring(0, 6) + '...' + account.substring(account.length - 4);
  }
}
