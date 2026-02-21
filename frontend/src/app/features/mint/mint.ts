import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ethers } from 'ethers';
import { WalletService } from '../../core/services/wallet.service';
import { ContractService, STEP_TYPES } from '../../core/services/contract.service';
import { calculateFileHash } from '../../shared/utils/hash.util';
import { getFriendlyError, EXPLORER_BASE_URL } from '../../shared/utils/error-messages.util';

type Phase = 'upload' | 'steps' | 'complete';

@Component({
  selector: 'app-mint',
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
            <p class="text-xl font-bold text-white/60 mb-4">Conecta tu wallet para registrar tu proceso creativo</p>
            <button (click)="walletService.connect()"
                    class="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase hover:brightness-110 transition-all">
              Conectar Pali Wallet
            </button>
          </div>
        } @else {
          <div class="bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

            <!-- PHASE INDICATOR -->
            <div class="flex items-center justify-center space-x-3 mb-8">
              @for (p of ['upload', 'steps', 'complete']; track p) {
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                       [class]="phase() === p ? 'bg-purple-500 text-white' : (phaseIndex(p) < phaseIndex(phase()) ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40')">
                    {{ phaseIndex(p) < phaseIndex(phase()) ? '✓' : phaseIndex(p) + 1 }}
                  </div>
                  @if (p !== 'complete') {
                    <div class="w-12 h-0.5" [class]="phaseIndex(p) < phaseIndex(phase()) ? 'bg-green-500' : 'bg-white/10'"></div>
                  }
                </div>
              }
            </div>

            <!-- PHASE 1: UPLOAD & MINT -->
            @if (phase() === 'upload') {
              <h2 class="text-3xl font-black uppercase mb-2 italic tracking-tighter text-white">Registrar Idea</h2>
              <p class="text-xs text-white/40 mb-8 font-bold uppercase tracking-widest">Sube tu audio y mintea el NFT base</p>

              <div class="space-y-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase opacity-40 ml-2 text-white">Archivo de audio</label>
                  <label class="flex items-center justify-center w-full p-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-purple-500/50 transition-all cursor-pointer bg-white/[0.02]">
                    <input type="file" accept="audio/*" (change)="handleFileChange($event)" [disabled]="isProcessing()" class="hidden">
                    <div class="text-center">
                      @if (fileName()) {
                        <p class="text-white font-bold">{{ fileName() }}</p>
                        <p class="text-white/40 text-xs mt-1">{{ fileSizeKB() }} KB</p>
                      } @else {
                        <p class="text-white/40 text-sm">Arrastra o selecciona un archivo de audio (max 10 MB)</p>
                      }
                    </div>
                  </label>
                </div>

                @if (audioHash()) {
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase opacity-40 ml-2 text-white">Hash SHA-256</label>
                    <div class="p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs text-green-400 break-all">
                      {{ audioHash() }}
                    </div>
                  </div>
                }

                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase opacity-40 ml-2 text-white">Token URI (opcional)</label>
                  <input type="text" [value]="tokenUri()" (input)="onUriChange($event)"
                         placeholder="ipfs://..."
                         class="w-full p-4 rounded-2xl font-bold outline-none text-white text-sm"
                         style="background: var(--card-bg); border: 1px solid var(--border-color);"
                         [disabled]="isProcessing()">
                </div>

                @if (statusMessage()) {
                  <p class="text-yellow-500 text-sm animate-pulse">{{ statusMessage() }}</p>
                }

                <button (click)="handleMint()"
                        [disabled]="!audioHash() || isProcessing()"
                        class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-2xl font-black uppercase text-white hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-purple-900/40 disabled:opacity-40 disabled:cursor-not-allowed">
                  {{ isProcessing() ? (statusMessage() || 'Procesando...') : 'Mintear NFT Base' }}
                </button>
              </div>
            }

            <!-- PHASE 2: CREATIVE STEPS -->
            @if (phase() === 'steps') {
              <h2 class="text-3xl font-black uppercase mb-2 italic tracking-tighter text-white">Chain of Evidence</h2>
              <p class="text-xs text-white/40 mb-2 font-bold uppercase tracking-widest">Token #{{ mintedTokenId() }} — Documenta tu proceso creativo</p>
              <p class="text-xs text-white/30 mb-8">Cada paso se registra on-chain como prueba de control humano</p>

              <div class="space-y-3 mb-8">
                @for (step of stepTypes; track step.id) {
                  <div class="flex items-center justify-between p-4 rounded-2xl border transition-all"
                       [class]="isStepDone(step.id) ? 'bg-green-500/20 border-green-500/50' : (currentStep() === step.id ? 'bg-purple-500/10 border-purple-500/50' : 'bg-white/5 border-white/10')">
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-widest"
                            [class]="isStepDone(step.id) ? 'text-green-400' : 'text-white/60'">
                        {{ step.label }}
                      </span>
                      <p class="text-[9px] text-white/30 mt-0.5">{{ step.description }}</p>
                    </div>
                    <div>
                      @if (isStepDone(step.id)) {
                        <span class="text-green-400 text-xs font-bold">✓ On-chain</span>
                      } @else if (currentStep() === step.id && isProcessing()) {
                        <span class="text-yellow-400 text-xs animate-pulse">Firmando...</span>
                      } @else {
                        <button (click)="submitStep(step.id)"
                                [disabled]="isProcessing()"
                                class="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 text-[10px] font-black uppercase hover:bg-purple-500/30 transition-all disabled:opacity-30">
                          ⚡ Registrar
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Integrity bar -->
              <div class="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl mb-6">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-[10px] font-black uppercase opacity-40 text-white">Integridad Legal</span>
                  <span class="text-xs font-black italic"
                        [class]="completedStepsCount() >= 3 ? 'text-green-500' : 'text-yellow-500'">
                    {{ completedStepsCount() < 3 ? 'EVIDENCIA DÉBIL' : 'EVIDENCIA FUERTE' }}
                  </span>
                </div>
                <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-purple-500 transition-all duration-500"
                       [style.width.%]="(completedStepsCount() / 5) * 100"></div>
                </div>
              </div>

              @if (statusMessage()) {
                <p class="text-yellow-500 text-sm mb-4 animate-pulse">{{ statusMessage() }}</p>
              }

              <div class="flex space-x-3">
                <button (click)="finishProcess()"
                        class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-2xl font-black uppercase text-white hover:brightness-110 transition-all text-sm">
                  Finalizar Proceso
                </button>
                <a routerLink="/" class="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-all no-underline text-center">
                  Volver
                </a>
              </div>
            }

            <!-- PHASE 3: COMPLETE -->
            @if (phase() === 'complete') {
              <div class="text-center py-8">
                <div class="text-6xl mb-6">🎵</div>
                <h2 class="text-3xl font-black uppercase italic tracking-tighter text-green-400 mb-4">Proceso Registrado</h2>
                <p class="text-white/60 mb-2">Token ID: <span class="font-mono text-white font-bold">#{{ mintedTokenId() }}</span></p>
                <p class="text-white/40 text-xs mb-8">{{ completedStepsCount() }}/5 pasos documentados on-chain</p>

                <div class="space-y-3">
                  <a [href]="explorerBaseUrl + '/tx/' + mintTxHash()"
                     target="_blank" rel="noopener noreferrer"
                     class="block w-full p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-sm hover:bg-purple-500/20 transition-all no-underline">
                    Ver en Explorer
                  </a>
                  <a routerLink="/"
                     class="block w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-all no-underline">
                    Volver al Leaderboard
                  </a>
                </div>
              </div>
            }
          </div>

          @if (errorMessage()) {
            <div class="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {{ errorMessage() }}
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class Mint {
  readonly explorerBaseUrl = EXPLORER_BASE_URL;
  readonly stepTypes = STEP_TYPES;

  readonly phase = signal<Phase>('upload');
  readonly fileName = signal('');
  readonly fileSizeKB = signal('');
  readonly audioHash = signal('');
  readonly tokenUri = signal('');
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly mintedTokenId = signal('');
  readonly mintTxHash = signal('');
  readonly completedStepIds = signal<number[]>([]);
  readonly currentStep = signal<number | null>(null);

  completedStepsCount = () => this.completedStepIds().length;

  constructor(
    readonly walletService: WalletService,
    private readonly contractService: ContractService,
  ) {}

  phaseIndex(p: string): number {
    return ['upload', 'steps', 'complete'].indexOf(p);
  }

  isStepDone(id: number): boolean {
    return this.completedStepIds().includes(id);
  }

  onUriChange(event: Event): void {
    this.tokenUri.set((event.target as HTMLInputElement).value);
  }

  async handleFileChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.errorMessage.set(null);
    this.audioHash.set('');

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 10) {
      this.errorMessage.set(`Archivo muy grande (${sizeMB.toFixed(1)} MB). Max 10 MB.`);
      return;
    }

    this.fileName.set(file.name);
    this.fileSizeKB.set((file.size / 1024).toFixed(2));

    try {
      this.statusMessage.set('Calculando hash SHA-256...');
      this.isProcessing.set(true);
      const hash = await calculateFileHash(file);
      this.audioHash.set(hash);
    } catch {
      this.errorMessage.set('No se pudo procesar el archivo.');
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  async handleMint(): Promise<void> {
    const hash = this.audioHash();
    if (!hash) return;

    this.errorMessage.set(null);
    this.isProcessing.set(true);

    try {
      this.statusMessage.set('Verificando duplicados...');
      const exists = await this.contractService.isHashRegistered(hash);
      if (exists) {
        this.errorMessage.set('Este audio ya esta registrado on-chain.');
        return;
      }

      this.statusMessage.set('Firmando en tu wallet...');
      const uri = this.tokenUri().trim() || 'ipfs://0xsonata/' + Date.now();
      const result = await this.contractService.mint(hash, uri);

      this.mintedTokenId.set(result.tokenId);
      this.mintTxHash.set(result.txHash);
      this.phase.set('steps');
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  async submitStep(stepType: number): Promise<void> {
    const tokenId = parseInt(this.mintedTokenId(), 10);
    if (isNaN(tokenId)) return;

    this.errorMessage.set(null);
    this.isProcessing.set(true);
    this.currentStep.set(stepType);

    try {
      const stepLabel = STEP_TYPES.find(s => s.id === stepType)?.label || 'Step';
      this.statusMessage.set(`Registrando: ${stepLabel}...`);

      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(`token-${tokenId}-step-${stepType}-${Date.now()}`));
      const metadata = JSON.stringify({ step: stepLabel, timestamp: new Date().toISOString() });

      await this.contractService.addStep(tokenId, contentHash, stepType, metadata);
      this.completedStepIds.update(ids => [...ids, stepType]);
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
      this.currentStep.set(null);
    }
  }

  finishProcess(): void {
    this.phase.set('complete');
  }
}
