// POR QUE: Pagina de entrada que orienta al usuario sobre que hacer.
//   Sin una landing, el usuario no sabe por donde empezar.
//
// QUE: Muestra informacion del contrato, links al explorer, y botones
//   para navegar a las acciones (mint y verify).
//
// COMO: Usa RouterLink para navegacion interna (sin recargar la pagina).
//   RouterLink es una directiva de Angular que convierte un <a> en un
//   enlace que cambia la ruta sin hacer una nueva peticion HTTP.

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../core/services/wallet.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <section class="hero">
        <h1>La idea musical existe desde el momento en que la creas</h1>
        <p class="hero-sub">
          0xSonata te permite registrar tus ideas musicales on-chain y obtener una
          prueba publica, inmutable y fechada de autoria como NFT.
        </p>

        @if (contractAddress) {
          <div class="contract-info">
            <p>
              Contrato en
              <a [href]="explorerBaseUrl + '/address/' + contractAddress" target="_blank" rel="noopener noreferrer">
                {{ contractAddress.substring(0, 6) }}...{{ contractAddress.substring(contractAddress.length - 4) }}
              </a>
              (zkSYS PoB Devnet)
            </p>
          </div>
        }
      </section>

      <section class="actions">
        @if (walletService.isConnected()) {
          <a routerLink="/mint" class="action-card">
            <h2>Registrar idea</h2>
            <p>Sube un audio (beat, melodia, loop) y registralo on-chain</p>
          </a>
          <a routerLink="/verify" class="action-card">
            <h2>Verificar idea</h2>
            <p>Atestigua que conoces una idea registrada por otro artista</p>
          </a>
        } @else {
          <div class="action-card action-card--disabled">
            <h2>Registrar idea</h2>
            <p>Conecta tu wallet para registrar ideas</p>
          </div>
          <div class="action-card action-card--disabled">
            <h2>Verificar idea</h2>
            <p>Conecta tu wallet para verificar ideas</p>
          </div>
        }
      </section>

      <section class="help">
        <h3>Como funciona</h3>
        <ol>
          <li>Conecta tu wallet (Pali Wallet)</li>
          <li>La app cambiara automaticamente a la red zkSYS PoB Devnet (57042)</li>
          <li>Sube un archivo de audio y el sistema calculara el hash automaticamente</li>
          <li>Haz clic en "Registrar Idea" para guardar la prueba on-chain</li>
          <li>Comparte tu Token ID para que otros artistas verifiquen tu idea</li>
        </ol>
      </section>
    </div>
  `,
  styles: [`
    .home { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
    .hero { text-align: center; margin-bottom: 40px; }
    .hero h1 { font-size: 1.8rem; margin-bottom: 16px; color: #111827; }
    .hero-sub { color: #6b7280; font-size: 1.05rem; line-height: 1.6; margin-bottom: 20px; }
    .contract-info {
      background: #fff;
      border: 1px solid rgba(148,163,184,0.5);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 0.9rem;
      color: #374151;
      display: inline-block;
    }
    .contract-info a { color: #f59e0b; text-decoration: none; }
    .contract-info a:hover { text-decoration: underline; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
    .action-card {
      background: #fff;
      border: 1px solid rgba(148,163,184,0.5);
      border-radius: 14px;
      padding: 24px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(148,163,184,0.2);
    }
    .action-card:hover { border-color: #f59e0b; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(148,163,184,0.3); }
    .action-card h2 { font-size: 1.3rem; margin-bottom: 8px; }
    .action-card p { color: #6b7280; font-size: 0.9rem; }
    .action-card--disabled { opacity: 0.5; cursor: default; }
    .action-card--disabled:hover { border-color: rgba(148,163,184,0.5); transform: none; box-shadow: 0 4px 12px rgba(148,163,184,0.2); }
    .help {
      background: #fff;
      border: 1px solid rgba(148,163,184,0.5);
      border-radius: 14px;
      padding: 24px;
    }
    .help h3 { margin-bottom: 16px; }
    .help ol { margin-left: 20px; color: #374151; }
    .help li { margin-bottom: 10px; line-height: 1.5; }
    @media (max-width: 640px) {
      .actions { grid-template-columns: 1fr; }
      .hero h1 { font-size: 1.4rem; }
    }
  `]
})
export class Home {
  readonly contractAddress = environment.contractAddress;
  readonly explorerBaseUrl = environment.explorerBaseUrl;

  constructor(readonly walletService: WalletService) {}
}
