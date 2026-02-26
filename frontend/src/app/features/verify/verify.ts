import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, RouterLink],
  host: { style: 'display: block' },
  template: `
    <div class="min-h-screen flex flex-col transition-colors duration-300"
         [style.background]="'radial-gradient(circle at 50% -20%, var(--card-hover) 0%, var(--bg-base) 80%)'">
      <nav class="flex items-center justify-between px-8 md:px-12 py-5 sticky top-0 z-50 backdrop-blur-xl border-b"
           style="background: var(--bg-nav); border-color: var(--border-color);">
        <a routerLink="/" class="flex items-center space-x-4 no-underline">
          <div class="logo">
            <span class="logo-icon">&#119070;</span>
            <span class="logo-text">0xSonata</span>
          </div>
        </a>
        <div class="flex items-center gap-4">
          <a routerLink="/" class="text-sm font-black uppercase tracking-widest no-underline pb-1" style="color: var(--text-subtle); border-bottom: 2px solid transparent;">Ranking</a>
          <a routerLink="/mint" class="text-sm font-black uppercase tracking-widest no-underline pb-1" style="color: var(--text-subtle); border-bottom: 2px solid transparent;">Crear NFT</a>
          <span class="text-sm font-black uppercase tracking-widest pb-1" style="color: var(--text-main); border-bottom: 2px solid #06b6d4;">Verificar</span>
          <div class="h-6 w-[1px]" style="background: var(--border-color);"></div>
          @if (!walletService.isConnected()) {
            <button (click)="walletService.connect()"
                    class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all">
              Conectar Wallet
            </button>
          } @else {
            <span class="text-sm font-mono flex items-center gap-2" style="color: var(--text-muted);">
              <span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              {{ walletService.account()?.slice(0,6) }}...{{ walletService.account()?.slice(-4) }}
            </span>
          }
        </div>
      </nav>

      <div class="flex-1 max-w-3xl mx-auto mt-10 px-8 pb-20 w-full">
        <div class="mb-6 flex items-center gap-2 text-sm" style="color: var(--text-subtle);">
          <a routerLink="/" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle);">Inicio</a>
          <span>/</span>
          <span style="color: var(--text-main);">Verificar Idea</span>
        </div>

        @if (!walletService.isConnected()) {
          <div class="p-10 rounded-3xl border text-center" style="background: var(--card-bg); border-color: var(--border-color);">
            <div class="text-5xl mb-4">🔗</div>
            <p class="text-xl font-bold mb-3" style="color: var(--text-muted);">Conecta tu wallet para verificar ideas</p>
            <p class="text-sm mb-6" style="color: var(--text-subtle);">Necesitas un stake mínimo de 0.001 tSYS. Al verificar, atestiguas que la autoría del artista es legítima.</p>
            <button (click)="walletService.connect()"
                    class="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black uppercase hover:brightness-110 transition-all">
              Conectar Pali Wallet
            </button>
            <p class="text-xs mt-4" style="color: var(--text-subtle);">¿No tienes Pali Wallet? <a href="https://paliwallet.com" target="_blank" class="text-cyan-400 hover:underline no-underline">Descárgala aquí ↗</a></p>
          </div>
        } @else {
          <div class="p-10 rounded-3xl border backdrop-blur-2xl shadow-2xl relative overflow-hidden" style="background: var(--card-bg); border-color: var(--border-color);">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <h2 class="text-3xl font-black uppercase mb-3 italic tracking-tighter" style="color: var(--text-main)">Verificar Idea</h2>
            <p class="text-sm mb-8" style="color: var(--text-subtle)">Atestigua la autoría de otro artista. Tu verificación aumenta la credibilidad de su registro.</p>

            <div class="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-8">
              <div class="flex justify-between items-center mb-3">
                <div>
                  <span class="text-sm font-black uppercase" style="color: var(--text-subtle)">Tu Stake</span>
                  <p class="text-xs mt-0.5" style="color: var(--text-subtle)">Garantía depositada para verificar</p>
                </div>
                <span class="text-lg font-bold text-cyan-400">{{ stakeBalance() }} tSYS</span>
              </div>
              
              @if (parseFloat(stakeBalance()) < 0.001) {
                <!-- Stake insuficiente -->
                <div class="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div class="flex items-start gap-3 mb-3">
                    <span class="text-xl">⚠️</span>
                    <div class="flex-1">
                      <p class="text-sm text-yellow-400 font-bold mb-1">Stake insuficiente</p>
                      <p class="text-xs text-yellow-400/80 leading-relaxed">
                        Para verificar artistas necesitas depositar <strong>mínimo 0.001 tSYS</strong> como garantía.
                        Esto asegura que las verificaciones sean honestas.
                      </p>
                    </div>
                  </div>
                  
                  <div class="space-y-3">
                    <button (click)="handleDeposit()"
                            [disabled]="isProcessing()"
                            class="w-full px-5 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm font-black uppercase hover:bg-cyan-500/30 transition-all disabled:opacity-30">
                      {{ isProcessing() ? '⏳ Confirma en tu wallet...' : '💰 Depositar 0.002 tSYS' }}
                    </button>
                    
                    <div class="text-xs text-yellow-400/60 text-center">
                      💡 ¿No tienes tSYS? 
                      <a href="https://faucet-pob.dev11.top/" target="_blank" 
                         class="text-cyan-400 hover:underline no-underline">
                        Consigue gratis en el faucet ↗
                      </a>
                    </div>
                  </div>
                </div>
              } @else {
                <!-- Stake suficiente -->
                <div class="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">✅</span>
                    <p class="text-sm text-green-400 font-bold">Stake suficiente para verificar</p>
                  </div>
                </div>
              }
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-black uppercase ml-2" style="color: var(--text-subtle)">Token ID de la idea a verificar</label>
                <input type="number" [value]="tokenIdValue()" (input)="onTokenIdChange($event)"
                       placeholder="Ej: 0, 1, 2..."
                       min="0" step="1"
                       class="w-full p-5 rounded-2xl font-bold outline-none text-base"
                       style="background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-main);"
                       [disabled]="isProcessing()">
                <p class="text-xs ml-2" style="color: var(--text-subtle)">El Token ID lo encuentras en el Explorer o en el perfil del artista que deseas verificar.</p>
              </div>

              @if (statusMessage()) {
                <div class="flex items-center gap-2 text-yellow-500 text-sm">
                  <div class="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                  {{ statusMessage() }}
                </div>
              }

              <button (click)="handleVerify()"
                      [disabled]="tokenIdValue() === '' || isProcessing() || parseFloat(stakeBalance()) < 0.001"
                      class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 p-5 rounded-2xl font-black uppercase text-white text-base hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-cyan-900/40 disabled:opacity-40 disabled:cursor-not-allowed">
                @if (isProcessing()) {
                  Procesando verificación...
                } @else if (parseFloat(stakeBalance()) < 0.001) {
                  🚫 Deposita stake primero
                } @else if (tokenIdValue() === '') {
                  📝 Ingresa Token ID
                } @else {
                  ✅ Verificar idea →
                }
              </button>

              @if (parseFloat(stakeBalance()) < 0.001 && tokenIdValue() !== '') {
                <p class="text-xs text-yellow-400/60 text-center">Debes depositar stake antes de poder verificar</p>
              }
            </div>
          </div>

          <!-- H9: Errores accionables -->
          @if (errorMessage()) {
            <div class="mt-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/30">
              <div class="flex items-start gap-3">
                <span class="text-lg">⚠️</span>
                <div>
                  <p class="text-red-400 text-sm font-bold">{{ errorMessage() }}</p>
                  <p class="text-red-400/50 text-xs mt-1">Verifica que el Token ID exista y que no hayas verificado esta idea previamente.</p>
                </div>
              </div>
            </div>
          }

          <!-- H1: Resultado visible y claro -->
          @if (result()) {
            <div class="mt-4 p-6 rounded-2xl bg-green-500/10 border border-green-500/30">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">✅</span>
                <p class="text-green-400 font-bold text-lg">¡Idea verificada correctamente!</p>
              </div>
              <p class="text-sm text-green-400/80">Total de verificaciones: <strong>{{ result()!.newVerificationCount }}</strong></p>
              <a [href]="explorerBaseUrl + '/tx/' + result()!.txHash"
                 target="_blank" rel="noopener noreferrer"
                 class="inline-block mt-3 text-cyan-400 text-sm hover:underline no-underline">
                Ver transacción en Explorer ↗
              </a>
            </div>
          }

          <!-- H3: Volver -->
          <div class="mt-6">
            <a routerLink="/"
               class="block w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-all no-underline text-center">
              ← Volver al Ranking
            </a>
          </div>
        }
      </div>
    </div>
  `,
})
export class Verify implements OnInit {
  readonly explorerBaseUrl = EXPLORER_BASE_URL;

  readonly tokenIdValue = signal('');
  readonly isProcessing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly result = signal<VerifySuccess | null>(null);
  readonly stakeBalance = signal('0');

  constructor(
    readonly walletService: WalletService,
    private readonly contractService: ContractService,
  ) {}

  ngOnInit() {
    this.loadStakeBalance();
  }

  parseFloat(val: string): number {
    return Number.parseFloat(val);
  }

  private async loadStakeBalance() {
    try {
      const account = this.walletService.account();
      if (account) {
        const balance = await this.contractService.getStakeBalance(account);
        this.stakeBalance.set(balance);
      }
    } catch { /* skip */ }
  }

  onTokenIdChange(event: Event): void {
    this.tokenIdValue.set((event.target as HTMLInputElement).value);
  }

  async handleDeposit(): Promise<void> {
    this.isProcessing.set(true);
    this.errorMessage.set(null);
    try {
      this.statusMessage.set('💰 Confirma el depósito de 0.002 tSYS en tu wallet...');
      await this.contractService.deposit('0.002');
      this.statusMessage.set('✅ Depósito exitoso! Recargando balance...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pequeña pausa para UX
      await this.loadStakeBalance();
      this.statusMessage.set(null);
    } catch (err: unknown) {
      const errorMsg = getFriendlyError(err);
      this.errorMessage.set(`❌ Error al depositar: ${errorMsg}`);
      this.statusMessage.set(null);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async handleVerify(): Promise<void> {
    const trimmed = this.tokenIdValue().trim();
    if (!trimmed) return;

    const tokenId = parseInt(trimmed, 10);
    if (isNaN(tokenId) || tokenId < 0) {
      this.errorMessage.set('El Token ID debe ser un número entero mayor o igual a 0.');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    try {
      this.statusMessage.set('Confirma la verificación en tu wallet...');
      const verifyResult = await this.contractService.verify(tokenId);
      this.result.set({
        txHash: verifyResult.txHash,
        tokenId: verifyResult.tokenId,
        newVerificationCount: verifyResult.newVerificationCount,
      });
      this.tokenIdValue.set('');
      await this.loadStakeBalance();
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }
}
