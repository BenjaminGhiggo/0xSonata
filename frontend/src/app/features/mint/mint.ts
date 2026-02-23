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
          <span class="text-sm font-black uppercase tracking-widest pb-1" style="color: var(--text-main); border-bottom: 2px solid #a855f7;">Crear NFT</span>
          <a routerLink="/verify" class="text-sm font-black uppercase tracking-widest no-underline pb-1" style="color: var(--text-subtle); border-bottom: 2px solid transparent;">Verificar</a>
          <div class="h-6 w-[1px]" style="background: var(--border-color);"></div>
          @if (!walletService.isConnected()) {
            <button (click)="walletService.connect()"
                    class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all">
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
          <span style="color: var(--text-main);">Registrar Proceso Creativo</span>
        </div>

        @if (!walletService.isConnected()) {
          <div class="p-10 rounded-3xl border text-center" style="background: var(--card-bg); border-color: var(--border-color);">
            <div class="text-5xl mb-4">🔗</div>
            <p class="text-xl font-bold mb-3" style="color: var(--text-muted);">Conecta tu wallet para comenzar</p>
            <p class="text-sm mb-6" style="color: var(--text-subtle);">Necesitas Pali Wallet conectada a la red zkSYS PoB Devnet (Chain ID 57042)</p>
            <button (click)="walletService.connect()"
                    class="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase hover:brightness-110 transition-all">
              Conectar Pali Wallet
            </button>
            <p class="text-xs mt-4" style="color: var(--text-subtle);">¿No tienes Pali Wallet? <a href="https://paliwallet.com" target="_blank" class="text-purple-400 hover:underline no-underline">Descárgala aquí ↗</a></p>
          </div>
        } @else {
          <div class="p-10 rounded-3xl border backdrop-blur-2xl shadow-2xl relative overflow-hidden" style="background: var(--card-bg); border-color: var(--border-color);">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>

            <!-- H1: INDICADOR DE FASE — siempre visible -->
            <div class="flex items-center justify-center gap-2 mb-10">
              @for (p of phases; track p.id) {
                <div class="flex items-center gap-2">
                  <div class="flex flex-col items-center gap-1">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all"
                         [class]="phase() === p.id ? 'bg-purple-500 text-white ring-2 ring-purple-500/50' : (phaseIndex(p.id) < phaseIndex(phase()) ? 'bg-green-500 text-white' : '')"
                         [style.background]="(phase() !== p.id && phaseIndex(p.id) >= phaseIndex(phase())) ? 'var(--badge-bg)' : null"
                         [style.color]="(phase() !== p.id && phaseIndex(p.id) >= phaseIndex(phase())) ? 'var(--text-subtle)' : null">
                      {{ phaseIndex(p.id) < phaseIndex(phase()) ? '✓' : phaseIndex(p.id) + 1 }}
                    </div>
                    <span class="text-xs font-bold" [class]="phase() === p.id ? 'text-purple-400' : ''" [style.color]="phase() === p.id ? '' : 'var(--text-subtle)'">{{ p.label }}</span>
                  </div>
                  @if (p.id !== 'complete') {
                    <div class="w-16 h-0.5 mb-5" [class]="phaseIndex(p.id) < phaseIndex(phase()) ? 'bg-green-500' : ''" [style.background]="phaseIndex(p.id) < phaseIndex(phase()) ? '' : 'var(--border-color)'"></div>
                  }
                </div>
              }
            </div>

            <!-- FASE 1: SUBIR Y MINTEAR -->
            @if (phase() === 'upload') {
              <h2 class="text-3xl font-black uppercase mb-3 italic tracking-tighter" style="color: var(--text-main)">Paso 1: Registrar Idea</h2>
              <p class="text-sm mb-8" style="color: var(--text-subtle)">Sube tu archivo de audio. Se calculará un hash SHA-256 único y se registrará como NFT en blockchain.</p>

              <div class="space-y-6">
                <div class="space-y-2">
                  <label class="text-sm font-black uppercase ml-2" style="color: var(--text-subtle)">Archivo de audio</label>
                  <label class="flex items-center justify-center w-full p-10 rounded-2xl border-2 border-dashed hover:border-purple-500/50 transition-all cursor-pointer"
                         style="border-color: var(--border-color); background: var(--input-bg);">
                    <input type="file" accept="audio/*" (change)="handleFileChange($event)" [disabled]="isProcessing()" class="hidden">
                    <div class="text-center">
                      @if (fileName()) {
                        <p class="font-bold text-base" style="color: var(--text-main)">{{ fileName() }}</p>
                        <p class="text-sm mt-1" style="color: var(--text-subtle)">{{ fileSizeKB() }} KB</p>
                      } @else {
                        <div class="text-3xl mb-2">📁</div>
                        <p class="text-sm" style="color: var(--text-subtle)">Haz clic o arrastra un archivo de audio (max 10 MB)</p>
                        <p class="text-xs mt-1" style="color: var(--text-subtle)">Formatos: MP3, WAV, OGG, FLAC</p>
                      }
                    </div>
                  </label>
                </div>

                @if (audioHash()) {
                  <div class="space-y-2">
                    <label class="text-sm font-black uppercase ml-2" style="color: var(--text-subtle)">Hash SHA-256 generado</label>
                    <div class="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 font-mono text-sm text-green-400 break-all">
                      {{ audioHash() }}
                    </div>
                    <p class="text-xs ml-2" style="color: var(--text-subtle)">Este hash es tu huella digital única. Nadie puede falsificarlo.</p>
                  </div>
                }

                <div class="space-y-2">
                  <label class="text-sm font-black uppercase ml-2" style="color: var(--text-subtle)">Token URI (opcional)</label>
                  <input type="text" [value]="tokenUri()" (input)="onUriChange($event)"
                         placeholder="ipfs://... (se genera automáticamente si lo dejas vacío)"
                         class="w-full p-4 rounded-2xl font-bold outline-none text-sm"
                         style="background: var(--card-bg); border: 1px solid var(--border-color);"
                         [disabled]="isProcessing()">
                </div>

                @if (statusMessage()) {
                  <div class="flex items-center gap-2 text-yellow-500 text-sm">
                    <div class="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                    {{ statusMessage() }}
                  </div>
                }

                <button (click)="handleMint()"
                        [disabled]="!audioHash() || isProcessing()"
                        class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-2xl font-black uppercase text-white hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-purple-900/40 disabled:opacity-40 disabled:cursor-not-allowed text-base">
                  {{ isProcessing() ? 'Procesando...' : 'Registrar en blockchain →' }}
                </button>
              </div>
            }

            <!-- FASE 2: PASOS CREATIVOS -->
            @if (phase() === 'steps') {
              <h2 class="text-3xl font-black uppercase mb-3 italic tracking-tighter mb-2" style="color: var(--text-main)">Paso 2: Documenta tu Proceso</h2>
              <p class="text-sm mb-2" style="color: var(--text-subtle)">Token #{{ mintedTokenId() }} registrado. Ahora documenta cada paso de tu proceso creativo.</p>
              <p class="text-xs mb-8" style="color: var(--text-subtle)">Cada paso se registra on-chain como prueba de control humano. Puedes completar los que apliquen a tu proceso.</p>

              <div class="space-y-3 mb-8">
                @for (step of stepTypes; track step.id) {
                  <div class="flex items-center justify-between p-5 rounded-2xl border transition-all"
                       [class]="isStepDone(step.id) ? 'bg-green-500/20 border-green-500/50' : (currentStep() === step.id ? 'bg-purple-500/10 border-purple-500/50' : '')"
                       [style.background]="(!isStepDone(step.id) && currentStep() !== step.id) ? 'var(--card-bg)' : null"
                       [style.border-color]="(!isStepDone(step.id) && currentStep() !== step.id) ? 'var(--border-color)' : null">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                              [class]="isStepDone(step.id) ? 'bg-green-500/30 text-green-300' : ''"
                              [style.background]="!isStepDone(step.id) ? 'var(--badge-bg)' : null"
                              [style.color]="!isStepDone(step.id) ? 'var(--text-subtle)' : null">
                          {{ isStepDone(step.id) ? '✓' : step.id + 1 }}
                        </span>
                        <span class="text-sm font-black uppercase tracking-widest"
                              [class]="isStepDone(step.id) ? 'text-green-400' : ''"
                              [style.color]="!isStepDone(step.id) ? 'var(--text-muted)' : null">
                          {{ step.label }}
                        </span>
                      </div>
                      <p class="text-xs mt-1 ml-9" style="color: var(--text-subtle)">{{ step.description }}</p>
                    </div>
                    <div>
                      @if (isStepDone(step.id)) {
                        <span class="text-green-400 text-sm font-bold">Registrado ✓</span>
                      } @else if (currentStep() === step.id && isProcessing()) {
                        <div class="flex items-center gap-2 text-yellow-400 text-sm">
                          <div class="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                          Firmando...
                        </div>
                      } @else {
                        <button (click)="submitStep(step.id)"
                                [disabled]="isProcessing()"
                                class="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 text-sm font-black uppercase hover:bg-purple-500/30 transition-all disabled:opacity-30">
                          Registrar
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- H1: Barra de progreso con texto claro -->
              <div class="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl mb-6">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-black uppercase" style="color: var(--text-subtle)">Integridad de Evidencia</span>
                  <span class="text-sm font-black italic"
                        [class]="completedStepsCount() >= 3 ? 'text-green-500' : 'text-yellow-500'">
                    {{ completedStepsCount() }}/5 — {{ completedStepsCount() < 3 ? 'Evidencia débil' : 'Evidencia fuerte' }}
                  </span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--badge-bg);">
                  <div class="h-full bg-purple-500 transition-all duration-500"
                       [style.width.%]="(completedStepsCount() / 5) * 100"></div>
                </div>
              </div>

              @if (statusMessage()) {
                <div class="flex items-center gap-2 text-yellow-500 text-sm mb-4">
                  <div class="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                  {{ statusMessage() }}
                </div>
              }

              <div class="flex gap-3">
                <button (click)="finishProcess()"
                        class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-2xl font-black uppercase text-white hover:brightness-110 transition-all text-sm">
                  Finalizar proceso →
                </button>
                <!-- H3: Volver siempre visible -->
                <a routerLink="/" class="px-6 py-4 rounded-2xl border font-bold text-sm transition-all no-underline text-center"
                   style="background: var(--card-bg); border-color: var(--border-color); color: var(--text-muted);">
                  ← Volver
                </a>
              </div>
            }

            <!-- FASE 3: COMPLETADO -->
            @if (phase() === 'complete') {
              <div class="text-center py-8">
                <div class="text-6xl mb-6">🎵</div>
                <h2 class="text-3xl font-black uppercase italic tracking-tighter text-green-400 mb-4">¡Proceso registrado!</h2>
                <p class="mb-2" style="color: var(--text-muted)">Token ID: <span class="font-mono font-bold" style="color: var(--text-main)">#{{ mintedTokenId() }}</span></p>
                <p class="text-sm mb-8" style="color: var(--text-subtle)">{{ completedStepsCount() }}/5 pasos documentados on-chain</p>

                <div class="space-y-3">
                  <a [href]="explorerBaseUrl + '/tx/' + mintTxHash()"
                     target="_blank" rel="noopener noreferrer"
                     class="block w-full p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-sm hover:bg-purple-500/20 transition-all no-underline">
                    Ver transacción en Explorer ↗
                  </a>
                  <a routerLink="/"
                     class="block w-full p-4 rounded-2xl border font-bold text-sm transition-all no-underline"
                     style="background: var(--card-bg); border-color: var(--border-color); color: var(--text-muted);">
                    ← Volver al Ranking
                  </a>
                </div>
              </div>
            }
          </div>

          <!-- H9: Errores accionables -->
          @if (errorMessage()) {
            <div class="mt-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/30">
              <div class="flex items-start gap-3">
                <span class="text-lg">⚠️</span>
                <div>
                  <p class="text-red-400 text-sm font-bold">{{ errorMessage() }}</p>
                  <p class="text-red-400/50 text-xs mt-1">Si el problema persiste, verifica tu conexión a zkSYS PoB Devnet y que tengas fondos suficientes.</p>
                </div>
              </div>
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
  readonly phases = [
    { id: 'upload' as Phase, label: 'Subir' },
    { id: 'steps' as Phase, label: 'Documentar' },
    { id: 'complete' as Phase, label: 'Listo' },
  ];

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
      this.errorMessage.set(`Archivo demasiado grande (${sizeMB.toFixed(1)} MB). El tamaño máximo es 10 MB. Intenta comprimir el archivo.`);
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
      this.errorMessage.set('No se pudo procesar el archivo. Verifica que sea un archivo de audio válido.');
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
      this.statusMessage.set('Verificando que no esté duplicado...');
      const exists = await this.contractService.isHashRegistered(hash);
      if (exists) {
        this.errorMessage.set('Este audio ya está registrado on-chain. Si es tu archivo, ya tienes la prueba de autoría.');
        return;
      }

      this.statusMessage.set('Confirma la transacción en tu wallet...');
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
