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
  template: `
    <div class="min-h-screen bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b_0%,#05060b_80%)]">
      <!-- NAV -->
      <nav class="flex items-center justify-between px-6 md:px-10 py-6 sticky top-0 z-50 backdrop-blur-xl border-b"
           style="background: rgba(5,6,11,0.6); border-color: rgba(255,255,255,0.05);">
        <a routerLink="/" class="flex items-center space-x-3 no-underline">
          <div class="w-10 h-10 bg-gradient-to-tr from-yellow-500 to-purple-600 rounded-full flex items-center justify-center font-black italic text-white shadow-lg text-sm">0x</div>
          <span class="text-xl font-black uppercase italic tracking-tighter text-white">0xSonata</span>
        </a>
        @if (!walletService.isConnected()) {
          <button (click)="walletService.connect()"
                  class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all">
            Conectar Wallet
          </button>
        } @else {
          <span class="text-xs text-white/40 font-mono">{{ walletService.account()?.slice(0,6) }}...{{ walletService.account()?.slice(-4) }}</span>
        }
      </nav>

      <div class="max-w-2xl mx-auto mt-12 px-6 pb-20">
        @if (!walletService.isConnected()) {
          <div class="bg-white/5 p-10 rounded-[3rem] border border-white/10 text-center">
            <p class="text-xl font-bold text-white/60 mb-4">Conecta tu wallet para verificar ideas</p>
            <p class="text-xs text-white/30 mb-6">Necesitas un stake minimo de 0.001 tSYS para verificar</p>
            <button (click)="walletService.connect()"
                    class="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase hover:brightness-110 transition-all">
              Conectar Pali Wallet
            </button>
          </div>
        } @else {
          <div class="bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <h2 class="text-3xl font-black uppercase mb-2 italic tracking-tighter text-white">Verificar Idea</h2>
            <p class="text-xs text-white/40 mb-8 font-bold uppercase tracking-widest">Atestigua la autoria de otro artista</p>

            <!-- Stake info -->
            <div class="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-6">
              <div class="flex justify-between items-center">
                <span class="text-[10px] font-black uppercase opacity-40 text-white">Tu Stake</span>
                <span class="text-sm font-bold text-cyan-400">{{ stakeBalance() }} tSYS</span>
              </div>
              @if (parseFloat(stakeBalance()) < 0.001) {
                <p class="text-[10px] text-yellow-400 mt-2">Necesitas min 0.001 tSYS de stake para verificar</p>
                <button (click)="handleDeposit()"
                        [disabled]="isProcessing()"
                        class="mt-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[10px] font-black uppercase hover:bg-cyan-500/30 transition-all">
                  Depositar 0.002 tSYS
                </button>
              }
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase opacity-40 ml-2 text-white">Token ID de la idea</label>
                <input type="number" [value]="tokenIdValue()" (input)="onTokenIdChange($event)"
                       placeholder="Ej: 0, 1, 2..."
                       min="0" step="1"
                       class="w-full p-4 rounded-2xl font-bold outline-none text-white text-sm"
                       style="background: var(--card-bg); border: 1px solid var(--border-color);"
                       [disabled]="isProcessing()">
              </div>

              @if (statusMessage()) {
                <p class="text-yellow-500 text-sm animate-pulse">{{ statusMessage() }}</p>
              }

              <button (click)="handleVerify()"
                      [disabled]="tokenIdValue() === '' || isProcessing()"
                      class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 p-5 rounded-2xl font-black uppercase text-white hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-cyan-900/40 disabled:opacity-40 disabled:cursor-not-allowed">
                {{ isProcessing() ? 'Procesando...' : 'Verificar Idea' }}
              </button>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {{ errorMessage() }}
            </div>
          }

          @if (result()) {
            <div class="mt-4 p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400">
              <p class="font-bold mb-2">Idea verificada correctamente</p>
              <p class="text-sm">Verificaciones totales: <strong>{{ result()!.newVerificationCount }}</strong></p>
              <a [href]="explorerBaseUrl + '/tx/' + result()!.txHash"
                 target="_blank" rel="noopener noreferrer"
                 class="text-cyan-400 text-sm mt-2 inline-block hover:underline no-underline">
                Ver en Explorer
              </a>
            </div>
          }
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
      this.statusMessage.set('Depositando stake...');
      await this.contractService.deposit('0.002');
      await this.loadStakeBalance();
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  async handleVerify(): Promise<void> {
    const trimmed = this.tokenIdValue().trim();
    if (!trimmed) return;

    const tokenId = parseInt(trimmed, 10);
    if (isNaN(tokenId) || tokenId < 0) {
      this.errorMessage.set('Token ID debe ser un numero entero >= 0.');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    try {
      this.statusMessage.set('Firmando verificacion...');
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
