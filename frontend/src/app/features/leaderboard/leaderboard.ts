import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService, LeaderboardEntry } from '../../core/services/api.service';

interface DisplayEntry extends LeaderboardEntry {
  seed: string;
  steps: number;
  tierClass: string;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  host: { style: 'display: block' },
  template: `
    <div class="min-h-screen transition-all duration-500 flex flex-col"
         [class]="isDarkMode()
           ? 'bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b_0%,#05060b_80%)]'
           : 'bg-[radial-gradient(circle_at_50%_-20%,#e0e7ff_0%,#f8fafc_80%)]'">

      <!-- H4: NAV CONSISTENTE — H2: Labels en español -->
      <nav class="flex flex-wrap items-center justify-between px-8 md:px-12 py-5 sticky top-0 z-50 backdrop-blur-xl border-b gap-4"
           style="background: var(--bg-nav); border-color: var(--border-color);">
        <a routerLink="/" class="flex items-center space-x-4 no-underline cursor-pointer">
          <div class="logo">
            <span class="logo-icon">&#119070;</span>
            <span class="logo-text">0xSonata</span>
          </div>
        </a>
        <div class="flex items-center space-x-3 md:space-x-6">
          <!-- H1: Indicador de pagina activa con underline -->
          <button (click)="setView('leaderboard')"
                  class="text-sm font-black uppercase tracking-widest transition-colors pb-1"
                  [style.color]="currentView() === 'leaderboard' ? 'var(--text-main)' : 'var(--text-subtle)'"
                  [style.border-bottom]="currentView() === 'leaderboard' ? '2px solid #a855f7' : '2px solid transparent'">
            Ranking
          </button>
          <button (click)="setView('register')"
                  class="text-sm font-black uppercase tracking-widest transition-colors pb-1"
                  [style.color]="currentView() === 'register' ? 'var(--text-main)' : 'var(--text-subtle)'"
                  [style.border-bottom]="currentView() === 'register' ? '2px solid #a855f7' : '2px solid transparent'">
            Registrar
          </button>
          <a routerLink="/mint"
             class="text-sm font-black uppercase tracking-widest transition-colors no-underline pb-1"
             style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
            Crear NFT
          </a>
          <a routerLink="/verify"
             class="text-sm font-black uppercase tracking-widest transition-colors no-underline pb-1"
             style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
            Verificar
          </a>
          <a routerLink="/tools"
             class="text-sm font-black uppercase tracking-widest transition-colors no-underline pb-1"
             style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
            Herramientas
          </a>
          <div class="h-6 w-[1px]" style="background: var(--border-color)"></div>
          <button (click)="toggleTheme()"
                  class="p-2 rounded-lg border hover:opacity-80 transition-all text-lg"
                  [attr.aria-label]="isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                  [attr.title]="isDarkMode() ? 'Modo claro' : 'Modo oscuro'"
                  style="background: var(--badge-bg); border-color: var(--border-color);">
            {{ isDarkMode() ? '☀️' : '🌙' }}
          </button>
        </div>
      </nav>

      <div class="flex-1">
      <!-- LEADERBOARD VIEW -->
      @if (currentView() === 'leaderboard') {

        <!-- HERO — H2: Mensaje claro de qué es y para qué -->
        <div class="max-w-3xl mx-auto text-center pt-14 px-8">
          <h1 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4" style="color: var(--text-main)">
            Prueba de Autoría Humana para Música con IA
          </h1>
          <p class="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style="color: var(--text-muted)">
            Documenta tu proceso creativo con Suno/Udio en blockchain. Cumple con el Copyright Office,
            protege tu derecho a monetizar y demuestra tu "control creativo significativo".
          </p>
        </div>

        <!-- H6: COMO FUNCIONA — Pasos SIEMPRE visibles con descripciones, no escondidos en tooltips -->
        <div class="max-w-4xl mx-auto mt-10 px-8">
          <h2 class="text-sm font-black uppercase tracking-[0.3em] text-center mb-6" style="color: var(--text-subtle)">¿Cómo funciona?</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            @for (guide of guideSteps; track guide.step) {
              <div class="p-5 rounded-xl border text-center transition-all hover:border-purple-500/30"
                   style="background: var(--card-bg); border-color: var(--card-border);">
                <!-- H6: Numero de paso visible = reconocimiento -->
                <div class="flex items-center justify-center gap-2 mb-3">
                  <span class="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">{{ guide.step }}</span>
                  <span class="text-2xl">{{ guide.icon }}</span>
                </div>
                <h3 class="text-sm font-black uppercase tracking-wide mb-2" style="color: var(--text-main)">{{ guide.title }}</h3>
                <p class="text-xs leading-relaxed" style="color: var(--text-muted)">{{ guide.description }}</p>
              </div>
            }
          </div>

          <!-- CTA con contexto — H2: Verbo accionable en español -->
          <div class="mt-8 flex items-center justify-center gap-4">
            <a routerLink="/mint"
               class="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm hover:brightness-110 transition-all shadow-lg shadow-purple-900/40 no-underline">
              Comenzar registro →
            </a>
            <a routerLink="/verify"
               class="px-8 py-4 rounded-xl border font-bold text-sm hover:opacity-80 transition-all no-underline"
               style="background: var(--card-bg); border-color: var(--border-color); color: var(--text-muted);">
              Verificar una idea
            </a>
          </div>
        </div>

        <!-- H1: LOADING STATE -->
        @if (isLoading()) {
          <div class="max-w-5xl mx-auto px-8 mt-16 text-center">
            <div class="inline-block w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p class="text-sm mt-3" style="color: var(--text-muted)">Cargando ranking...</p>
          </div>
        }

        <!-- TOP 3 PODIO -->
        @if (!isLoading() && top3().length >= 3) {
          <div class="max-w-5xl mx-auto px-8 mt-16">
            <h2 class="text-sm font-black uppercase tracking-[0.3em] text-center mb-4" style="color: var(--text-subtle)">Top artistas</h2>
            <div class="h-12"></div>
            <div class="grid grid-cols-3 items-end gap-4 md:gap-8">

              <!-- #2 PLATA -->
              <div class="flex flex-col items-center" style="animation: divine-float 6s infinite;">
                <div class="relative mb-4">
                  <div class="wings-system wings-sm silver-wings" [innerHTML]="wingsHtml(3)"></div>
                  <div class="silver-aura"></div>
                  <img [src]="getAvatar(top3()[1].seed)"
                       class="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-3 border-slate-300 relative z-10 bg-slate-800/40 object-cover"
                       style="box-shadow: 0 0 30px rgba(203,213,225,0.3);"
                       [alt]="'Avatar de ' + top3()[1].alias">
                  <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl z-20">🥈</div>
                </div>
                <h3 class="text-lg md:text-xl font-bold text-center text-slate-300 uppercase tracking-wide mb-3" style="color: var(--text-main)">{{ top3()[1].alias }}</h3>
                <div class="pedestal-plata w-full rounded-t-2xl text-center py-6 px-3" style="min-height: 140px;">
                  <span class="font-black text-2xl tracking-tighter block" style="color: var(--text-main)">{{ top3()[1].score | number }}</span>
                  <span class="text-xs uppercase font-black mt-2 block" style="color: var(--text-subtle)">Puntaje de Integridad</span>
                </div>
              </div>

              <!-- #1 ORO -->
              <div class="flex flex-col items-center" style="animation: divine-float 4s infinite;">
                <div class="relative mb-5">
                  <div class="wings-system gold-wings" [innerHTML]="wingsHtml(5)"></div>
                  <div class="god-rays" style="inset: -30%; filter: blur(30px);"></div>
                  <img [src]="getAvatar(top3()[0].seed)"
                       class="w-44 h-44 md:w-56 md:h-56 rounded-3xl border-4 border-yellow-500 relative z-10 bg-indigo-950/30 object-cover"
                       style="box-shadow: 0 0 60px rgba(255,215,0,0.3);"
                       [alt]="'Avatar de ' + top3()[0].alias">
                  <div class="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl z-20">👑</div>
                </div>
                <h3 class="text-2xl md:text-3xl font-black text-yellow-500 italic uppercase tracking-tighter text-center mb-4" style="color: var(--text-main)">{{ top3()[0].alias }}</h3>
                <div class="pedestal-divino w-full rounded-t-3xl text-center py-10 px-4 shadow-xl" style="min-height: 200px;">
                  <span class="text-4xl md:text-5xl font-black italic drop-shadow-md tracking-tighter block" style="color: var(--text-main)">{{ top3()[0].score | number }}</span>
                  <span class="text-sm uppercase font-black mt-3 tracking-[0.2em] block" style="color: var(--text-subtle)">Puntaje de Integridad</span>
                </div>
              </div>

              <!-- #3 BRONCE -->
              <div class="flex flex-col items-center" style="animation: divine-float 7s infinite;">
                <div class="relative mb-4">
                  <div class="wings-system wings-xs bronze-wings" [innerHTML]="wingsHtml(2)"></div>
                  <img [src]="getAvatar(top3()[2].seed)"
                       class="w-28 h-28 md:w-36 md:h-36 rounded-xl border-2 border-orange-700/50 relative z-10 bg-indigo-950/20 object-cover shadow-lg"
                       [alt]="'Avatar de ' + top3()[2].alias">
                  <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl z-20">🥉</div>
                </div>
                <h3 class="text-lg md:text-xl font-bold text-center mb-3" style="color: var(--text-main)">{{ top3()[2].alias }}</h3>
                <div class="pedestal-bronce w-full rounded-t-2xl text-center py-5 px-3" style="min-height: 110px;">
                  <span class="font-black text-orange-400 text-2xl tracking-tighter block" style="color: var(--text-main)">{{ top3()[2].score | number }}</span>
                  <span class="text-xs uppercase font-black mt-2 block" style="color: var(--text-subtle)">Puntaje de Integridad</span>
                </div>
              </div>

            </div>
          </div>
        }

        <!-- LISTA DE OTROS ARTISTAS -->
        @if (!isLoading() && others().length > 0) {
          <div class="max-w-3xl mx-auto mt-16 space-y-4 px-8">
            <h4 class="text-sm font-black uppercase tracking-[0.3em] text-center mb-8" style="color: var(--text-muted)">Registros de Evidencia Creativa</h4>
            @for (entry of others(); track entry.address) {
              <div class="flex items-center justify-between p-5 md:p-6 rounded-2xl border transition-all group backdrop-blur-md"
                   style="background: var(--card-bg); border-color: var(--card-border);">
                <div class="flex items-center space-x-4">
                  <span class="font-black w-8 text-base" style="color: var(--text-subtle)">#{{ entry.rank }}</span>
                  <img [src]="getAvatar(entry.seed)" class="w-14 h-14 rounded-xl bg-black/20" [alt]="'Avatar de ' + entry.alias">
                  <span class="font-bold uppercase tracking-tight text-base group-hover:text-purple-400 transition-colors" style="color: var(--text-main)">{{ entry.alias }}</span>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-xl font-black italic" style="color: var(--text-main)">{{ entry.score | number }}</span>
                  <span class="text-xs uppercase font-bold mt-1" style="color: var(--text-subtle)">Puntaje de Integridad</span>
                </div>
              </div>
            }
          </div>
        }

        <!-- H1: Estado vacio explicito -->
        @if (!isLoading() && entries().length === 0) {
          <div class="max-w-2xl mx-auto mt-16 px-8 text-center">
            <div class="text-5xl mb-4">🎵</div>
            <p class="text-lg font-bold" style="color: var(--text-main)">Aún no hay artistas registrados</p>
            <p class="text-sm mt-2" style="color: var(--text-muted)">Sé el primero en registrar tu proceso creativo</p>
            <a routerLink="/mint"
               class="inline-block mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm no-underline">
              Comenzar registro →
            </a>
          </div>
        }

        <!-- QUE OFRECE 0xSonata -->
        <div class="max-w-6xl mx-auto mt-24 px-8">
          <h2 class="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-center mb-3" style="color: var(--text-main)">
            ¿Qué ofrece 0xSonata?
          </h2>
          <p class="text-center text-base mb-12" style="color: var(--text-muted)">
            Cuatro capas de protección para tu música
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (feat of features; track feat.title) {
              <div class="p-8 rounded-2xl border transition-all hover:border-purple-500/30"
                   style="background: var(--card-bg); border-color: var(--card-border);">
                <div class="flex items-start gap-5">
                  <div class="text-4xl shrink-0">{{ feat.icon }}</div>
                  <div>
                    <h3 class="text-lg font-black uppercase tracking-tight mb-2" style="color: var(--text-main)">{{ feat.title }}</h3>
                    <p class="text-sm leading-relaxed" style="color: var(--text-muted)">{{ feat.description }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- PERSONAS -->
        <div class="max-w-5xl mx-auto mt-24 px-8">
          <h2 class="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-center mb-3" style="color: var(--text-main)">
            ¿Te identificas?
          </h2>
          <p class="text-center text-base mb-12" style="color: var(--text-muted)">
            Historias reales de artistas que necesitan proteger su trabajo
          </p>
          <div class="space-y-8">
            @for (persona of personas; track persona.name) {
              <div class="p-8 md:p-10 rounded-2xl border transition-all"
                   style="background: var(--card-bg); border-color: var(--card-border);">
                <div class="flex flex-col md:flex-row gap-6">
                  <div class="shrink-0 flex flex-col items-center md:items-start">
                    <div class="w-20 h-20 rounded-xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg"
                         [class]="persona.gradient">
                      {{ persona.emoji }}
                    </div>
                    <span class="text-base font-black uppercase mt-3 tracking-wider" style="color: var(--text-main)">{{ persona.name }}</span>
                    <span class="text-sm" style="color: var(--text-subtle)">{{ persona.location }}</span>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-bold text-lg mb-3" style="color: var(--text-main)">{{ persona.problem_title }}</h4>
                    <p class="text-sm leading-relaxed mb-4" style="color: var(--text-muted)">{{ persona.problem }}</p>
                    <div class="p-4 rounded-xl border-l-3 border-purple-500" style="background: rgba(168,85,247,0.05);">
                      <p class="text-sm font-bold leading-relaxed" style="color: var(--text-main)">
                        <span class="text-purple-500">Con 0xSonata → </span>{{ persona.solution }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

      }

      <!-- REGISTER VIEW -->
      @if (currentView() === 'register') {
        <div class="max-w-3xl mx-auto mt-16 px-8 pb-16">
          <!-- H3: Breadcrumb -->
          <div class="mb-6 flex items-center gap-2 text-sm" style="color: var(--text-subtle)">
            <button (click)="setView('leaderboard')" class="hover:text-purple-400 transition-colors">Inicio</button>
            <span>/</span>
            <span style="color: var(--text-main)">Registrar proceso</span>
          </div>

          <div class="p-10 md:p-14 rounded-3xl border backdrop-blur-2xl shadow-2xl relative overflow-hidden"
               style="background: var(--card-bg); border-color: var(--border-color);">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <h2 class="text-3xl font-black uppercase mb-3 italic tracking-tighter" style="color: var(--text-main)">Evidencia de Autoría Humana</h2>
            <p class="text-sm mb-10 font-bold uppercase tracking-widest" style="color: var(--text-subtle)">Documenta tu proceso creativo con IA para el Copyright Office</p>

            <div class="space-y-6">
              <div class="space-y-3">
                <label class="text-sm font-black uppercase ml-2" style="color: var(--text-subtle)">Nombre del Proyecto</label>
                <input #regName placeholder="Ej: Neon Reggaeton Beat"
                       class="w-full p-5 rounded-xl font-bold outline-none transition-all text-base"
                       style="background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main);">
              </div>

              <div class="grid grid-cols-1 gap-3">
                <label class="text-sm font-black uppercase ml-2" style="color: var(--text-subtle)">Pasos del Proceso</label>
                @for (step of creativeSteps; track step.id) {
                  <button (click)="toggleStep(step.id)"
                          class="flex items-center justify-between p-4 rounded-xl border transition-all text-left"
                          [class]="isStepComplete(step.id)
                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                            : ''"
                          [style.background]="!isStepComplete(step.id) ? 'var(--card-bg)' : ''"
                          [style.border-color]="!isStepComplete(step.id) ? 'var(--border-color)' : ''"
                          [style.color]="!isStepComplete(step.id) ? 'var(--text-subtle)' : ''">
                    <div class="flex items-center gap-3">
                      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                            [class]="isStepComplete(step.id) ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white/40'">
                        {{ isStepComplete(step.id) ? '✓' : step.id + 1 }}
                      </span>
                      <span class="text-sm font-black uppercase tracking-widest">{{ step.label }}</span>
                    </div>
                    <span class="text-sm">{{ isStepComplete(step.id) ? 'Completado' : 'Vincular' }}</span>
                  </button>
                }
              </div>

              <!-- H1: Barra de progreso con estado claro -->
              <div class="p-5 rounded-xl" style="background: rgba(168,85,247,0.05); border: 1px solid rgba(168,85,247,0.1);">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-black uppercase" style="color: var(--text-subtle)">Integridad</span>
                  <span class="text-base font-black italic"
                        [class]="completedSteps().length >= 3 ? 'text-green-500' : 'text-yellow-500'">
                    {{ completedSteps().length }}/5 pasos — {{ completedSteps().length < 3 ? 'Evidencia débil' : 'Evidencia fuerte' }}
                  </span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--badge-bg);">
                  <div class="h-full bg-purple-500 transition-all duration-500"
                       [style.width.%]="(completedSteps().length / 5) * 100"></div>
                </div>
              </div>

              <button routerLink="/mint"
                      class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-xl font-black uppercase text-white text-base hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-purple-900/40">
                Ir a registrar on-chain →
              </button>

              <!-- H3: Volver -->
              <button (click)="setView('leaderboard')"
                      class="w-full p-4 rounded-xl border text-sm font-bold transition-all text-center"
                      style="background: var(--card-bg); border-color: var(--border-color); color: var(--text-muted);">
                ← Volver al Ranking
              </button>
            </div>
          </div>
        </div>
      }
      </div>

      <!-- H3/H10: FOOTER — Navegacion persistente y ayuda -->
      <footer class="mt-auto border-t px-8 py-8" style="border-color: var(--border-color); background: var(--bg-nav);">
        <div class="max-w-5xl mx-auto">
          <div class="flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-3">
              <div class="logo" style="font-size: 1rem;">
                <span class="logo-icon">&#119070;</span>
                <span class="logo-text" style="font-size: 0.9rem;">0xSonata</span>
              </div>
              <span class="text-sm font-bold" style="color: var(--text-muted)">Cadena de Evidencia Creativa</span>
            </div>
            <nav class="flex items-center gap-6 text-sm" style="color: var(--text-subtle);">
              <button (click)="setView('leaderboard')" class="hover:text-purple-400 transition-colors">Ranking</button>
              <a routerLink="/mint" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">Crear NFT</a>
              <a routerLink="/verify" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">Verificar</a>
              <a routerLink="/tools" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">Herramientas</a>
              <a href="https://explorer-pob.dev11.top" target="_blank" rel="noopener noreferrer"
                 class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">Explorer ↗</a>
            </nav>
          </div>
          <p class="text-center text-xs mt-6" style="color: var(--text-subtle)">
            Desplegado en zkSYS PoB Devnet (Chain ID 57042) · Código abierto
          </p>
        </div>
      </footer>

    </div>
  `,
})
export class Leaderboard implements OnInit {
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  isDarkMode = signal(true);
  currentView = signal<'leaderboard' | 'register'>('leaderboard');
  entries = signal<DisplayEntry[]>([]);
  completedSteps = signal<number[]>([]);
  isLoading = signal(true);

  guideSteps = [
    { step: 1, icon: '🤖', title: 'Genera con IA', description: 'Crea tu canción en Suno/Udio. Guarda el prompt exacto que usaste y las variaciones que la IA generó para ti.' },
    { step: 2, icon: '✍️', title: 'Documenta tu aporte', description: 'Registra tu prompt, selecciones y ediciones. Esto prueba tu "autoría humana significativa" para el Copyright Office.' },
    { step: 3, icon: '⛓️', title: 'Sella en blockchain', description: 'Cada paso genera un hash con timestamp inmutable. Tu evidencia creativa queda protegida para siempre.' },
    { step: 4, icon: '📜', title: 'Certificado de autoría', description: 'Descarga un PDF con toda tu cadena de evidencia: prompts, variaciones, selecciones y ediciones humanas.' },
  ];

  features = [
    {
      icon: '🤖',
      title: 'Proceso Creativo con IA',
      description: 'Registra cada paso: tu prompt en Suno/Udio, las variaciones que generaste, cuál elegiste y por qué, y las ediciones humanas en tu DAW. Esto es lo que el Copyright Office llama "autoría humana significativa".',
    },
    {
      icon: '🔐',
      title: 'Evidencia Inmutable',
      description: 'Cada paso genera un hash SHA-256 con timestamp en blockchain. Nadie puede alterar tu registro. Tu evidencia de autoría humana existe para siempre.',
    },
    {
      icon: '🏆',
      title: 'Reputación Verificada',
      description: 'Acumula verificaciones de otros artistas que confirman tu proceso creativo. Sube de nivel: Emergente → Bronce → Plata → Oro. Tu reputación te precede.',
    },
    {
      icon: '🤝',
      title: 'Colaboraciones Claras',
      description: 'Tú registras tus letras, tu colaborador registra su instrumental con IA. Luego crean un Project Vault con splits definidos (ej: 50%-50%). Pagos automáticos, sin peleas.',
    },
  ];

  personas = [
    {
      name: 'Jake',
      location: 'Lima, 22 años',
      emoji: '🎤',
      gradient: 'from-pink-500 to-purple-600',
      problem_title: 'Generó 50 canciones en Suno, no puede copyrightear ninguna',
      problem: 'Usa Suno Pro ($30/mes) para crear beats de reggaeton. Sube 3 canciones semanales a Spotify pero leyó que "música 100% IA no tiene copyright". Teme que alguien más registre SUS canciones y le quite las regalías. No puede pagar $45 por registro en Copyright Office.',
      solution: 'Registra cada paso: prompt exacto en Suno, las 10 variaciones que generó, por qué eligió la #7, edición de vocales en GarageBand. Certificado PDF muestra "autoría humana significativa". Spotify acepta su evidencia.',
    },
    {
      name: 'Valeria',
      location: 'Ciudad de México, 26 años',
      emoji: '🎹',
      gradient: 'from-blue-500 to-indigo-600',
      problem_title: 'YouTube le quitó monetización por "contenido IA"',
      problem: 'Compositora para medios que usa Udio para demos rápidos. YouTube le marcó 15 videos como "contenido generado por IA" sin monetización. El Copyright Office de EE.UU. le pidió prueba de "aporte humano significativo" para registrar su banda sonora.',
      solution: 'Registra prompts, screenshots de variaciones en Udio, archivos de proyecto de Ableton con ediciones humanas. Certificado 0xSonata prueba que transformó material IA. YouTube restaura monetización, Copyright Office acepta registro.',
    },
    {
      name: 'Andrés & Camila',
      location: 'Buenos Aires, 25 y 28 años',
      emoji: '🤝',
      gradient: 'from-green-500 to-teal-600',
      problem_title: 'Colaboración IA + Humana sin acuerdo de splits',
      problem: 'Camila escribe letras, Andrés genera instrumentales con Suno. Lanzan EP de 6 tracks en DistroKid pero no acordaron porcentajes. Andrés quiere usar 2 tracks para proyecto solista. Camila dice que sus letras son 50% del valor. No tienen contrato escrito.',
      solution: 'Camila registra sus letras (Token #12), Andrés registra su instrumental IA (Token #13). Crean Project Vault con split 50%-50% on-chain. DistroKid paga a la wallet del Vault, smart contract distribuye automáticamente.',
    },
  ];

  top3 = computed(() => this.entries().slice(0, 3));
  others = computed(() => this.entries().slice(3));

  creativeSteps = [
    { id: 0, label: 'Prompt en Suno/Udio' },
    { id: 1, label: 'Variaciones IA Generadas' },
    { id: 2, label: 'Tu Selección (decisión humana)' },
    { id: 3, label: 'Edición DAW (aporte humano)' },
    { id: 4, label: 'Master Final' },
  ];

  private wingsCache = new Map<number, SafeHtml>();

  ngOnInit() {
    this.loadLeaderboard();
  }

  wingsHtml(featherCount: number): SafeHtml {
    if (this.wingsCache.has(featherCount)) {
      return this.wingsCache.get(featherCount)!;
    }
    let feathers = '';
    for (let i = 1; i <= featherCount; i++) {
      const rotS = 15 + (i - 1) * 18;
      const rotE = 30 + (i - 1) * 22;
      const moveY = 5 + (i - 1) * 5;
      const h = 100 + (i - 1) * 12;
      feathers += `<div class="pluma" style="--rot-start:${rotS}deg;--rot-end:${rotE}deg;--move-y:${moveY}px;height:${h}px;animation-delay:${i * 0.1}s;z-index:${15 - i}"></div>`;
    }
    const html = `<div class="ala ala-izquierda">${feathers}</div><div class="ala ala-derecha">${feathers}</div>`;
    const safe = this.sanitizer.bypassSecurityTrustHtml(html);
    this.wingsCache.set(featherCount, safe);
    return safe;
  }

  private loadLeaderboard() {
    this.isLoading.set(true);
    this.apiService.getLeaderboard().subscribe({
      next: (data) => {
        const display: DisplayEntry[] = data.map((e) => ({
          ...e,
          seed: e.alias || e.address,
          steps: Math.min(e.totalMints + 1, 5),
          tierClass: e.tier >= 3 ? 'gold' : e.tier >= 2 ? 'silver' : e.tier >= 1 ? 'bronze' : 'emergent',
        }));
        this.entries.set(display);
        this.isLoading.set(false);
      },
      error: () => {
        this.entries.set(this.getFallbackData());
        this.isLoading.set(false);
      },
    });
  }

  private getFallbackData(): DisplayEntry[] {
    return [
      { rank: 1, address: '0x...VA01', alias: 'Jake_FL', totalMints: 1, totalVerificationsReceived: 1, tier: 0, tierLabel: 'Emergente', score: 4, isSeed: true, seed: 'jake', steps: 0, tierClass: 'emergent' },
      { rank: 2, address: '0x...DI02', alias: 'Diego_Prod', totalMints: 1, totalVerificationsReceived: 0, tier: 0, tierLabel: 'Emergente', score: 3, isSeed: true, seed: 'diego', steps: 0, tierClass: 'emergent' },
      { rank: 3, address: '0x...AN03', alias: 'Andres_M', totalMints: 0, totalVerificationsReceived: 0, tier: 0, tierLabel: 'Emergente', score: 2, isSeed: true, seed: 'andres', steps: 0, tierClass: 'emergent' },
      { rank: 4, address: '0x...CA04', alias: 'Camila_AI', totalMints: 0, totalVerificationsReceived: 0, tier: 0, tierLabel: 'Emergente', score: 1, isSeed: true, seed: 'camila', steps: 0, tierClass: 'emergent' },
    ];
  }

  getAvatar(seed: string): string {
    const bgSet = this.isDarkMode() ? 'bg2' : 'bg1';
    return `https://robohash.org/${encodeURIComponent(seed)}.png?set=set1&bgset=${bgSet}`;
  }

  toggleTheme() {
    this.isDarkMode.update((v) => !v);
    document.body.classList.toggle('light-mode', !this.isDarkMode());
  }

  setView(view: 'leaderboard' | 'register') {
    this.currentView.set(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleStep(id: number) {
    this.completedSteps.update((steps) => {
      const idx = steps.indexOf(id);
      if (idx === -1) return [...steps, id];
      return steps.filter((s) => s !== id);
    });
  }

  isStepComplete(id: number): boolean {
    return this.completedSteps().includes(id);
  }
}
