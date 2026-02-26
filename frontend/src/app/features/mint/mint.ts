import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ethers } from 'ethers';
import { WalletService } from '../../core/services/wallet.service';
import { ContractService, STEP_TYPES, StepContent } from '../../core/services/contract.service';
import { calculateFileHash } from '../../shared/utils/hash.util';
import { getFriendlyError, EXPLORER_BASE_URL } from '../../shared/utils/error-messages.util';

type Phase = 'upload' | 'steps' | 'complete';

interface TooltipData {
  title: string;
  content: string;
}

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
            
            @if (walletService.error()) {
              <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p class="text-red-400 text-sm font-bold">⚠️ Error: {{ walletService.error() }}</p>
              </div>
            }
            
            <div class="space-y-4">
              <button (click)="walletService.connect()"
                      [disabled]="walletService.isConnecting()"
                      class="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {{ walletService.isConnecting() ? 'Conectando...' : 'Conectar Pali Wallet' }}
              </button>
              
              @if (!walletService.hasWallet) {
                <div class="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p class="text-yellow-400 text-sm mb-2">⚠️ No detectamos Pali Wallet instalada</p>
                  <a href="https://paliwallet.com" target="_blank" 
                     class="inline-block px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold text-sm hover:bg-purple-500/30 transition-all no-underline">
                    Descargar Pali Wallet ↗
                  </a>
                </div>
              }
            </div>
            
            <p class="text-xs mt-6" style="color: var(--text-subtle);">
              ¿Ya tienes Pali Wallet? Asegúrate de estar en la red <strong>zkSYS PoB Devnet (57042)</strong>
            </p>
          </div>
        } @else {
          <div class="p-10 rounded-3xl border backdrop-blur-2xl shadow-2xl relative overflow-hidden" style="background: var(--card-bg); border-color: var(--border-color);">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>

            <!-- FASE 1: SUBIR Y MINTEAR -->
            @if (phase() === 'upload') {
              <div class="flex items-center gap-3 mb-6">
                <h2 class="text-3xl font-black uppercase italic tracking-tighter" style="color: var(--text-main)">Paso 1: Registrar Idea</h2>
                <button (click)="openTooltip('paso1')"
                        class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:bg-purple-500/20"
                        style="color: var(--text-muted); border: 1px solid var(--border-color);">
                  ℹ️
                </button>
              </div>
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
              <div class="flex items-center gap-3 mb-6">
                <h2 class="text-3xl font-black uppercase italic tracking-tighter mb-2" style="color: var(--text-main)">Paso 2: Documenta tu Proceso</h2>
                <button (click)="openTooltip('paso2')"
                        class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:bg-purple-500/20"
                        style="color: var(--text-muted); border: 1px solid var(--border-color);">
                  ℹ️
                </button>
              </div>
              
              @if (mintedTokenId() === 'N/A') {
                <!-- ALERTA: Token ID no capturado -->
                <div class="mb-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
                  <div class="flex items-start gap-3 mb-4">
                    <span class="text-2xl">⚠️</span>
                    <div>
                      <h3 class="text-lg font-black uppercase text-red-400 mb-2">Token ID no capturado</h3>
                      <p class="text-sm text-red-300 mb-4">
                        El mint se completó en blockchain, pero no pudimos capturar tu Token ID. 
                        Esto puede pasar por un problema de red o de la wallet.
                      </p>
                    </div>
                  </div>
                  
                  <div class="space-y-4">
                    <div class="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <p class="text-sm font-bold text-purple-300 mb-2">✅ Tu NFT está seguro en blockchain</p>
                      <p class="text-xs text-purple-200">
                        El audio se registró correctamente. Solo necesitamos encontrar el Token ID para continuar.
                      </p>
                    </div>
                    
                    <div>
                      <p class="text-sm font-bold uppercase mb-2" style="color: var(--text-subtle)">Opción 1: Buscar automáticamente</p>
                      <button (click)="searchTokenId()"
                              [disabled]="isProcessing()"
                              class="w-full p-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50">
                        {{ isProcessing() ? 'Buscando...' : '🔍 Buscar mi Token ID' }}
                      </button>
                    </div>
                    
                    <div>
                      <p class="text-sm font-bold uppercase mb-2" style="color: var(--text-subtle)">Opción 2: Ingresar manualmente</p>
                      <div class="flex gap-2">
                        <input type="text" [value]="manualTokenId()" (input)="onManualTokenChange($event)"
                               placeholder="Ej: 2"
                               class="flex-1 p-3 rounded-xl font-mono font-bold outline-none text-sm"
                               style="background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-main);">
                        <button (click)="recoverFromManualToken()"
                                [disabled]="isProcessing()"
                                class="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50">
                          {{ isProcessing() ? '...' : 'Usar' }}
                        </button>
                      </div>
                      <p class="text-xs mt-2" style="color: var(--text-subtle)">
                        ¿No sabes tu Token ID? <button (click)="openTooltip('tokenid')" class="text-purple-400 hover:underline">Ver instrucciones</button>
                      </p>
                    </div>
                  </div>
                </div>
              } @else {
                <!-- Token ID capturado correctamente -->
                <p class="text-sm mb-2" style="color: var(--text-subtle)">Token #{{ mintedTokenId() }} registrado. Ahora documenta cada paso de tu proceso creativo.</p>
                <p class="text-xs mb-8" style="color: var(--text-subtle)">Cada paso se registra on-chain como prueba de control humano. Puedes completar los que apliquen a tu proceso.</p>
              }

              <div class="space-y-4 mb-8">
                @for (step of stepTypes; track step.id) {
                  <div class="rounded-2xl border transition-all overflow-hidden"
                       [class]="isStepDone(step.id) ? 'bg-green-500/20 border-green-500/50' : (currentStepIndex() === step.id ? 'border-purple-500/50' : 'border-color')"
                       [style.background]="(!isStepDone(step.id) && currentStepIndex() !== step.id) ? 'var(--card-bg)' : null"
                       [style.border-color]="(!isStepDone(step.id) && currentStepIndex() !== step.id) ? 'var(--border-color)' : null">
                    
                    <!-- Header del paso -->
                    <div class="p-5" (click)="!isStepDone(step.id) && openStepForm(step.id)" [class.cursor-pointer]="!isStepDone(step.id)">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                                [class]="isStepDone(step.id) ? 'bg-green-500/30 text-green-300' : ''"
                                [style.background]="!isStepDone(step.id) ? 'var(--badge-bg)' : null"
                                [style.color]="!isStepDone(step.id) ? 'var(--text-subtle)' : null">
                            {{ isStepDone(step.id) ? '✓' : step.id + 1 }}
                          </span>
                          <div>
                            <span class="text-sm font-black uppercase tracking-widest"
                                  [class]="isStepDone(step.id) ? 'text-green-400' : ''"
                                  [style.color]="!isStepDone(step.id) ? 'var(--text-main)' : null">
                              {{ step.label }}
                            </span>
                            @if (!isStepDone(step.id)) {
                              <p class="text-xs" style="color: var(--text-subtle)">Click para documentar</p>
                            }
                          </div>
                        </div>
                        @if (!isStepDone(step.id)) {
                          <button class="text-purple-400 text-sm font-bold hover:text-purple-300">
                            {{ currentStepIndex() === step.id ? 'Cancelar' : 'Documentar →' }}
                          </button>
                        } @else {
                          <span class="text-green-400 text-sm font-bold">Completado</span>
                        }
                      </div>
                    </div>

                    <!-- Form del paso (se muestra cuando está activo) -->
                    @if (currentStepIndex() === step.id && !isStepDone(step.id)) {
                      <div class="p-5 pt-0 border-t" style="border-color: var(--border-color)">
                        
                        <!-- Tooltip explicativo -->
                        <div class="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          <div class="flex items-start gap-2">
                            <span class="text-lg">ℹ️</span>
                            <div class="text-xs" style="color: var(--text-subtle)">
                              @if (step.id === 0) {
                                <strong>¿Qué es el Prompt?</strong> El texto exacto que escribiste en Suno/Udio para generar tu canción. Ej: "reggaeton beat 95bpm, dembow pesado, synth oscuro"
                              } @else if (step.id === 1) {
                                <strong>Variaciones de IA:</strong> Describe las opciones que generó la IA y cuál te gustó más. Puedes subir el audio de las variaciones.
                              } @else if (step.id === 2) {
                                <strong>Selección Creativa:</strong> Explica POR QUÉ elegiste esa variación. Tu decisión creativa demuestra autoría humana.
                              } @else if (step.id === 3) {
                                <strong>Edición DAW:</strong> Lista los edits manuales que hiciste: EQ, compresión, MIDI original, FX, etc. Esto es evidencia clave de autoría.
                              } @else if (step.id === 4) {
                                <strong>Master Final:</strong> Especificaciones del master (LUFS, sample rate) y el audio final masterizado.
                              }
                            </div>
                          </div>
                        </div>

                        <!-- Campo de texto principal -->
                        <div class="mb-4">
                          <label class="text-sm font-black uppercase mb-2 block" style="color: var(--text-subtle)">
                            {{ step.id === 0 ? 'Prompt exacto:' : step.id === 3 ? 'Ediciones realizadas (una por línea):' : 'Descripción:' }}
                          </label>
                          <textarea
                            [value]="stepFormData()[step.id]?.text || ''"
                            (input)="onStepTextChange(step.id, $any($event.target).value)"
                            [placeholder]="step.id === 0 ? 'Ej: lofi hip hop beat, 90bpm, jazzy piano, chill vibes...' : (step.id === 3 ? 'EQ en el kick (corte 30Hz)\\nCompresión en dembow (4:1)\\nHi-hats adicionales (patrón propio)\\nLínea de bajo con MIDI (100% original)' : '')"
                            rows="4"
                            class="w-full p-3 rounded-xl font-normal outline-none text-sm resize-none"
                            style="background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main)">
                          </textarea>
                        </div>

                        <!-- Campos específicos por paso -->
                        @if (step.id === 0 || step.id === 3) {
                          <div class="mb-4">
                            <label class="text-sm font-black uppercase mb-2 block" style="color: var(--text-subtle)">
                              {{ step.id === 0 ? 'Plataforma IA:' : 'DAW usado:' }}
                            </label>
                            <input
                              type="text"
                              [value]="stepFormData()[step.id]?.platform || ''"
                              (input)="onStepPlatformChange(step.id, $any($event.target).value)"
                              [placeholder]="step.id === 0 ? 'Ej: Suno AI v3.5, Udio 1.0...' : 'Ej: Ableton Live 11, FL Studio 21, Logic Pro X...'"
                              class="w-full p-3 rounded-xl font-normal outline-none text-sm"
                              style="background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main)">
                          </div>
                        }

                        <!-- Upload de archivos (PRÓXIMAMENTE) -->
                        <div class="mb-4 p-4 rounded-xl border border-dashed"
                             style="border-color: var(--border-color); background: rgba(168,85,247,0.05);">
                          <div class="flex items-start gap-3">
                            <span class="text-2xl">📎</span>
                            <div class="flex-1">
                              <h4 class="text-sm font-black uppercase mb-1" style="color: var(--text-main)">
                                Archivos de evidencia (Próximamente)
                              </h4>
                              <p class="text-xs mb-2" style="color: var(--text-subtle)">
                                <strong>Pronto podrás subir:</strong> Screenshots del prompt, audio de variaciones, proyecto DAW, master final.
                                Los archivos se guardarán en IPFS para permanencia permanente.
                              </p>
                              <p class="text-xs" style="color: var(--text-subtle)">
                                💡 <strong>Por ahora:</strong> Guarda tus archivos localmente en tu computadora.
                                El texto que registres en blockchain ya es evidencia válida para Copyright Office.
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Botones de acción -->
                        <div class="flex gap-3">
                          <button
                            (click)="submitStepWithContent(step.id)"
                            [disabled]="isProcessing() || !stepFormData()[step.id]?.text"
                            class="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ isProcessing() ? 'Registrando...' : 'Registrar paso' }}
                          </button>
                          <button
                            (click)="cancelStepForm()"
                            class="px-6 py-3 rounded-xl border font-bold text-sm hover:bg-white/5 transition-all"
                            style="border-color: var(--border-color); color: var(--text-subtle)">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    }
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

          <!-- Entrada manual de Token ID cuando el audio ya está registrado -->
          @if (showManualTokenInput()) {
            <div class="mt-4 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
              <div class="flex items-start gap-3 mb-4">
                <span class="text-lg">ℹ️</span>
                <div>
                  <p class="text-yellow-400 text-sm font-bold mb-2">¿Tu audio ya estaba registrado?</p>
                  <p class="text-yellow-400/70 text-xs">
                    Esto puede pasar si el registro anterior se interrumpió. Ingresa tu Token ID para continuar donde lo dejaste.
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <label class="text-sm font-black uppercase" style="color: var(--text-subtle)">Token ID</label>
                  <button (click)="openTooltip('tokenid')"
                          class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:bg-purple-500/20"
                          style="color: var(--text-muted); border: 1px solid var(--border-color);">
                    ℹ️
                  </button>
                </div>
                <div class="flex gap-2">
                  <input type="text" [value]="manualTokenId()" (input)="onManualTokenChange($event)"
                         placeholder="Ej: 42"
                         class="flex-1 p-3 rounded-xl font-mono font-bold outline-none text-sm"
                         style="background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-main);">
                  <button (click)="recoverFromManualToken()"
                          [disabled]="isProcessing()"
                          class="px-5 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black uppercase text-sm hover:brightness-110 transition-all disabled:opacity-40">
                    {{ isProcessing() ? '...' : 'Recuperar' }}
                  </button>
                </div>
                <button (click)="showManualTokenInput.set(false)"
                        class="text-xs font-bold uppercase transition-all"
                        style="color: var(--text-subtle);">
                  ← Cancelar, volver al error
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- MODAL TOOLTIP -->
      @if (tooltipOpen()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" (click)="closeTooltip()">
          <div class="relative max-w-lg w-full p-6 rounded-2xl border shadow-2xl animate-in fade-in zoom-in duration-200"
               style="background: var(--card-bg); border-color: var(--border-color);"
               (click)="$event.stopPropagation()">
            <button (click)="closeTooltip()"
                    class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:bg-red-500/20"
                    style="color: var(--text-muted); border: 1px solid var(--border-color);">
              ✕
            </button>
            <h3 class="text-xl font-black uppercase mb-4" style="color: var(--text-main)">
              {{ tooltipData()?.title }}
            </h3>
            <div class="text-sm leading-relaxed space-y-3" style="color: var(--text-muted)">
              @if (tooltipKey() === 'paso1') {
                <p><strong class="text-purple-400">¿Qué es el Paso 1?</strong></p>
                <p>Subes tu archivo de audio y se genera un hash SHA-256 único que se registra como NFT en blockchain.</p>
                <div class="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p class="text-yellow-400"><strong>⚠️ Importante:</strong> Si el proceso se interrumpe (cierre de página, error de red, etc.), tu NFT ya puede estar creado en blockchain.</p>
                </div>
                <p class="text-green-400"><strong>✓ Solución:</strong> En el siguiente paso, el sistema buscará automáticamente tu Token ID. Si no lo encuentra, podrás ingresarlo manualmente.</p>
              } @else if (tooltipKey() === 'paso2') {
                <p><strong class="text-purple-400">¿Qué es el Paso 2?</strong></p>
                <p>Registras cada paso de tu proceso creativo con IA (Suno, Udio, etc.) para demostrar tu "autoría humana significativa" ante el Copyright Office.</p>
                <div class="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p class="text-green-400"><strong>✓ Búsqueda automática:</strong> El sistema busca automáticamente tus tokens registrados en tu wallet y carga los pasos que ya completaste.</p>
                </div>
                <p class="text-yellow-400"><strong>ℹ️ Si no encuentra tu token:</strong> Podrás ingresar el Token ID manualmente. Para encontrarlo, ve al explorador y busca tus transacciones.</p>
              } @else if (tooltipKey() === 'tokenid') {
                <p><strong class="text-purple-400">¿Cómo encontrar tu Token ID?</strong></p>
                <ol class="list-decimal list-inside space-y-2 ml-2">
                  <li>Ve al explorador <a href="https://explorer-pob.dev11.top" target="_blank" class="text-purple-400 hover:underline">explorer-pob.dev11.top</a></li>
                  <li>Busca tu dirección de wallet (la que usaste para conectar)</li>
                  <li>Busca tus transacciones recientes del contrato <code class="px-2 py-1 rounded bg-purple-500/20 text-purple-300">SonataNFT</code></li>
                  <li>El Token ID es el número que aparece en el evento <code class="px-2 py-1 rounded bg-purple-500/20 text-purple-300">SonataMinted</code></li>
                </ol>
                <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 mt-4">
                  <p class="text-purple-300"><strong>💡 Consejo:</strong> También puedes ver el Token ID en la URL de tu NFT en el explorador.</p>
                </div>
              }
            </div>
            <button (click)="closeTooltip()"
                    class="w-full mt-6 p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm hover:brightness-110 transition-all">
              Entendido
            </button>
          </div>
        </div>
      }
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
  readonly showManualTokenInput = signal(false);
  readonly manualTokenId = signal('');
  readonly tooltipOpen = signal(false);
  readonly tooltipKey = signal<string>('');
  
  // Señales para los campos de cada paso
  readonly currentStepIndex = signal<number | null>(null);
  readonly stepFormData = signal<Record<number, {
    text: string;
    platform?: string;
    daw?: string;
    specs?: string;
  }>>({});

  completedStepsCount = () => this.completedStepIds().length;

  tooltipData = () => {
    const key = this.tooltipKey();
    if (key === 'paso1') {
      return { title: 'Paso 1: Registrar Idea' };
    } else if (key === 'paso2') {
      return { title: 'Paso 2: Documenta tu Proceso' };
    } else if (key === 'tokenid') {
      return { title: '¿Cómo encontrar tu Token ID?' };
    }
    return { title: 'Ayuda' };
  };

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

  onManualTokenChange(event: Event): void {
    this.manualTokenId.set((event.target as HTMLInputElement).value);
  }

  openTooltip(key: string): void {
    this.tooltipKey.set(key);
    this.tooltipOpen.set(true);
  }

  closeTooltip(): void {
    this.tooltipOpen.set(false);
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
        // El audio ya está registrado - buscar el Token ID
        this.statusMessage.set('Audio ya registrado. Buscando tu Token ID...');

        try {
          // Buscar por hash de audio
          const userAddress = this.walletService.account();
          if (!userAddress) {
            throw new Error('Wallet no conectada');
          }
          const tokenId = await this.contractService.findTokenIdByAudioHash(hash, userAddress);

          if (tokenId) {
            // Verificar si ya tiene pasos registrados
            const steps = await this.contractService.getCreativeSteps(parseInt(tokenId));

            this.mintedTokenId.set(tokenId);
            this.completedStepIds.set(steps.map(s => s.stepType));
            this.phase.set('steps');
            this.statusMessage.set(null);
            return;
          }
        } catch (searchError) {
          console.error('Error buscando tokenId:', searchError);
        }

        // Si no se encontró, mostrar error con opción manual
        this.errorMessage.set(
          `Este audio ya está registrado on-chain. ` +
          `Token ID recuperado: ${this.mintedTokenId() || 'no encontrado'}. ` +
          `Si es tu archivo, puedes ingresar el Token ID manualmente abajo.`
        );
        this.showManualTokenInput.set(true);
        this.isProcessing.set(false);
        return;
      }

      this.statusMessage.set('Confirma la transacción en tu wallet...');
      const uri = this.tokenUri().trim() || 'ipfs://0xsonata/' + Date.now();
      const result = await this.contractService.mint(hash, uri);

      this.mintedTokenId.set(result.tokenId);
      this.mintTxHash.set(result.txHash);
      this.phase.set('steps');
      
      // Sincronizar con backend para leaderboard
      try {
        const userAddress = this.walletService.account();
        await fetch('/api/ideas/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId: parseInt(result.tokenId),
            audioHash: hash,
            creatorAddress: userAddress || '',
            verificationCount: 0,
            stepCount: 0,
            blockTimestamp: Date.now(),
            txHash: result.txHash,
          }),
        });
      } catch (syncError) {
        console.warn('Failed to sync mint with backend:', syncError);
      }
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  /**
   * Abre el form para editar un paso
   */
  openStepForm(stepId: number): void {
    this.currentStepIndex.set(stepId);
    // Inicializar form data si no existe
    if (!this.stepFormData()[stepId]) {
      this.stepFormData.update(data => ({
        ...data,
        [stepId]: { text: '', platform: '', daw: '', specs: '' }
      }));
    }
  }

  /**
   * Cierra el form sin guardar
   */
  cancelStepForm(): void {
    this.currentStepIndex.set(null);
  }

  /**
   * Actualiza el texto del form
   */
  onStepTextChange(stepId: number, value: string): void {
    this.stepFormData.update(data => ({
      ...data,
      [stepId]: { ...data[stepId], text: value }
    }));
  }

  /**
   * Actualiza el campo platform/daw
   */
  onStepPlatformChange(stepId: number, value: string): void {
    this.stepFormData.update(data => ({
      ...data,
      [stepId]: { ...data[stepId], platform: value, daw: value }
    }));
  }

  /**
   * Actualiza el campo specs
   */
  onStepSpecsChange(stepId: number, value: string): void {
    this.stepFormData.update(data => ({
      ...data,
      [stepId]: { ...data[stepId], specs: value }
    }));
  }

  /**
   * Registra un paso con su contenido
   */
  async submitStepWithContent(stepType: number): Promise<void> {
    const tokenId = parseInt(this.mintedTokenId(), 10);
    const formData = this.stepFormData()[stepType];

    // Validar que haya texto
    if (!formData || !formData.text) {
      this.errorMessage.set('Debes ingresar una descripción para este paso.');
      return;
    }

    // Validar Token ID
    if (isNaN(tokenId)) {
      this.errorMessage.set('Token ID no válido. Intenta de nuevo.');
      return;
    }

    this.errorMessage.set(null);
    this.isProcessing.set(true);

    try {
      const stepLabel = STEP_TYPES.find(s => s.id === stepType)?.label || 'Step';
      this.statusMessage.set(`Registrando ${stepLabel}...`);

      // Preparar contenido (SOLO TEXTO por ahora)
      const content: StepContent = {
        prompt: stepType === 0 ? formData.text : undefined,
        platform: formData.platform,
        description: stepType === 1 ? formData.text : undefined,
        reason: stepType === 2 ? formData.text : undefined,
        edits: stepType === 3 ? formData.text.split('\n').filter(line => line.trim()) : undefined,
        daw: formData.daw,
        specs: stepType === 4 ? formData.text || formData.specs : undefined,
      };

      // NOTA: IPFS se implementará en el futuro para archivos
      // const contentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(content)));
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(content)));

      // Registrar en blockchain
      await this.contractService.addStep(tokenId, contentHash, stepType, content);
      this.completedStepIds.update(ids => [...ids, stepType]);
      this.currentStepIndex.set(null);
      
      // Sincronizar con backend para leaderboard
      try {
        await fetch('/api/ideas/sync-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            contentHash,
            stepType,
            metadata: JSON.stringify(content),
            blockTimestamp: Date.now(),
          }),
        });
      } catch (syncError) {
        console.warn('Failed to sync step with backend:', syncError);
      }
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err));
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  /**
   * Versión simplificada para registrar sin form (legacy)
   */
  async submitStep(stepType: number): Promise<void> {
    await this.submitStepWithContent(stepType);
  }

  /**
   * Busca el Token ID del usuario automáticamente
   */
  async searchTokenId(): Promise<void> {
    this.errorMessage.set(null);
    this.isProcessing.set(true);
    this.statusMessage.set('Buscando tu Token ID en blockchain...');

    try {
      const userAddress = this.walletService.account();
      if (!userAddress) {
        throw new Error('Wallet no conectada');
      }

      const hash = this.audioHash();
      if (!hash) {
        throw new Error('No hay hash de audio');
      }

      // Primero intentar por hash de audio con la wallet
      const tokenIds = await this.contractService.findTokenIdsByOwner(userAddress);
      console.log('[DEBUG] Token IDs encontrados:', tokenIds);

      if (tokenIds.length === 0) {
        // Si no encuentra, usar el backend para buscar por dirección
        console.log('[DEBUG] Intentando buscar con backend...');
        const backendTokenIds = await this.fetchTokenIdsFromBackend(userAddress);
        
        if (backendTokenIds.length === 0) {
          this.errorMessage.set('No encontramos tokens registrados a tu wallet. Intenta recargar la página.');
          this.isProcessing.set(false);
          return;
        }

        // Verificar cuál coincide con el hash
        for (const tokenId of backendTokenIds) {
          try {
            const proof = await this.contractService.getProof(parseInt(tokenId));
            if (proof.audioHash.toLowerCase() === hash.toLowerCase()) {
              this.mintedTokenId.set(tokenId);
              const steps = await this.contractService.getCreativeSteps(parseInt(tokenId));
              this.completedStepIds.set(steps.map(s => s.stepType));
              this.statusMessage.set(null);
              this.isProcessing.set(false);
              return;
            }
          } catch {
            // Token no existe o error, continuar con el siguiente
          }
        }

        this.errorMessage.set(`Encontramos ${backendTokenIds.length} token(s) pero ninguno coincide con este audio.`);
        this.isProcessing.set(false);
        return;
      }

      // Si hay un token, verificar si coincide con el hash
      for (const tokenId of tokenIds) {
        try {
          const proof = await this.contractService.getProof(parseInt(tokenId));
          if (proof.audioHash.toLowerCase() === hash.toLowerCase()) {
            // Encontrado!
            this.mintedTokenId.set(tokenId);
            const steps = await this.contractService.getCreativeSteps(parseInt(tokenId));
            this.completedStepIds.set(steps.map(s => s.stepType));
            this.statusMessage.set(null);
            this.isProcessing.set(false);
            return;
          }
        } catch {
          // Token no existe o error, continuar con el siguiente
        }
      }

      // Si llegamos aquí, encontramos tokens pero ninguno coincide con el hash
      this.errorMessage.set(`Encontramos ${tokenIds.length} token(s) pero ninguno coincide con este audio. Los tokens son: ${tokenIds.join(', ')}`);
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err) || 'Error buscando Token ID');
    } finally {
      this.statusMessage.set(null);
      this.isProcessing.set(false);
    }
  }

  /**
   * Obtiene los Token IDs desde el backend
   */
  private async fetchTokenIdsFromBackend(creatorAddress: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/blockchain/tokens/${creatorAddress}`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data || [];
    } catch {
      return [];
    }
  }

  /**
   * Recupera un proceso existente usando Token ID ingresado manualmente
   */
  async recoverFromManualToken(): Promise<void> {
    const tokenId = this.manualTokenId().trim();
    if (!tokenId || isNaN(parseInt(tokenId))) {
      this.errorMessage.set('Ingresa un Token ID válido');
      return;
    }

    this.errorMessage.set(null);
    this.isProcessing.set(true);
    this.statusMessage.set('Verificando Token ID...');

    try {
      // Verificar que el token existe y pertenece al usuario
      const proof = await this.contractService.getProof(parseInt(tokenId));
      const userAddress = this.walletService.account();

      if (proof.creator.toLowerCase() !== userAddress?.toLowerCase()) {
        this.errorMessage.set('Este Token ID no pertenece a tu wallet');
        this.isProcessing.set(false);
        return;
      }

      // Verificar que el hash coincide
      const currentHash = this.audioHash();
      if (proof.audioHash.toLowerCase() !== currentHash.toLowerCase()) {
        this.errorMessage.set('El hash de este audio no coincide con el Token ID');
        this.isProcessing.set(false);
        return;
      }

      // Todo válido - cargar los pasos existentes
      const steps = await this.contractService.getCreativeSteps(parseInt(tokenId));

      this.mintedTokenId.set(tokenId);
      this.completedStepIds.set(steps.map(s => s.stepType));
      this.showManualTokenInput.set(false);
      this.phase.set('steps');
      this.statusMessage.set(null);
    } catch (err: unknown) {
      this.errorMessage.set(getFriendlyError(err) || 'Token ID no encontrado en blockchain');
    } finally {
      this.isProcessing.set(false);
      this.statusMessage.set(null);
    }
  }

  finishProcess(): void {
    this.phase.set('complete');
  }
}
