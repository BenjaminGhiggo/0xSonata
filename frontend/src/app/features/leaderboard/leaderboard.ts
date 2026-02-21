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
    <div class="min-h-screen transition-all duration-500"
         [class]="isDarkMode()
           ? 'bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b_0%,#05060b_80%)]'
           : 'bg-[radial-gradient(circle_at_50%_-20%,#e0e7ff_0%,#f8fafc_80%)]'">

      <!-- NAV -->
      <nav class="flex flex-wrap items-center justify-between px-8 md:px-12 py-5 sticky top-0 z-50 backdrop-blur-xl border-b gap-4"
           style="background: var(--bg-nav); border-color: var(--border-color);">
        <div class="flex items-center space-x-4 cursor-pointer" routerLink="/">
          <div class="w-12 h-12 bg-gradient-to-tr from-yellow-500 to-purple-600 rounded-full flex items-center justify-center font-black italic text-white shadow-lg text-sm">0x</div>
          <div>
            <span class="text-xl md:text-2xl font-black uppercase italic tracking-tighter" style="color: var(--text-main)">0xSonata</span>
            <div class="text-xs font-bold tracking-[0.3em] uppercase -mt-0.5" style="color: var(--text-subtle)">Creative Evidence Chain</div>
          </div>
        </div>
        <div class="flex items-center space-x-3 md:space-x-6">
          <button (click)="setView('leaderboard')"
                  class="text-sm font-black uppercase tracking-widest transition-colors"
                  [style.color]="currentView() === 'leaderboard' ? 'var(--text-main)' : 'var(--text-subtle)'">
            Hierarchy
          </button>
          <button (click)="setView('register')"
                  class="text-sm font-black uppercase tracking-widest transition-colors"
                  [style.color]="currentView() === 'register' ? 'var(--text-main)' : 'var(--text-subtle)'">
            Register
          </button>
          <div class="h-6 w-[1px]" style="background: var(--border-color)"></div>
          <button (click)="toggleTheme()"
                  class="p-2 rounded-lg border hover:opacity-80 transition-all text-lg"
                  style="background: var(--badge-bg); border-color: var(--border-color);">
            {{ isDarkMode() ? '☀️' : '🌙' }}
          </button>
        </div>
      </nav>

      <!-- LEADERBOARD VIEW -->
      @if (currentView() === 'leaderboard') {

        <!-- HERO -->
        <div class="max-w-3xl mx-auto text-center pt-14 px-8">
          <h1 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4" style="color: var(--text-main)">
            Protege tu creatividad musical
          </h1>
          <p class="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style="color: var(--text-muted)">
            Registra cada paso de tu proceso creativo en blockchain. Prueba inmutable de autoria,
            verificacion comunitaria y certificados descargables.
          </p>

          <!-- HOW IT WORKS -->
          <div class="mt-10 grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            @for (guide of guideSteps; track guide.step) {
              <div class="relative">
                <button (click)="toggleGuide(guide.step)"
                        class="w-full p-4 rounded-xl border transition-all text-center"
                        [style.background]="activeGuide() === guide.step ? 'rgba(168,85,247,0.15)' : 'var(--card-bg)'"
                        [style.border-color]="activeGuide() === guide.step ? 'rgba(168,85,247,0.4)' : 'var(--card-border)'">
                  <div class="text-2xl mb-2">{{ guide.icon }}</div>
                  <div class="text-xs font-black uppercase tracking-wider leading-tight" style="color: var(--text-muted)">{{ guide.title }}</div>
                </button>
                @if (activeGuide() === guide.step) {
                  <div class="absolute z-30 top-full mt-2 left-1/2 -translate-x-1/2 w-72 p-4 rounded-xl shadow-2xl text-left"
                       [style.background]="isDarkMode() ? '#12122a' : '#ffffff'"
                       [style.border]="isDarkMode() ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(0,0,0,0.1)'">
                    <p class="text-sm leading-relaxed" style="color: var(--text-muted)">{{ guide.description }}</p>
                    <button (click)="toggleGuide(0)" class="mt-2 text-xs text-purple-500 hover:text-purple-400 font-bold">Cerrar</button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- CTA -->
          <div class="mt-8 flex items-center justify-center gap-4">
            <a routerLink="/mint"
               class="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm hover:brightness-110 transition-all shadow-lg shadow-purple-900/40 no-underline">
              Registrar Proceso
            </a>
            <a routerLink="/verify"
               class="px-8 py-4 rounded-xl border font-bold text-sm hover:opacity-80 transition-all no-underline"
               style="background: var(--card-bg); border-color: var(--border-color); color: var(--text-muted);">
              Verificar Idea
            </a>
          </div>
        </div>

        <!-- DIVINE TOP 3 PODIUM -->
        @if (top3().length >= 3) {
          <div class="max-w-5xl mx-auto px-8 mt-16">
            <div class="grid grid-cols-3 items-end gap-4 md:gap-8">

              <!-- #2 SILVER -->
              <div class="flex flex-col items-center" style="animation: divine-float 6s infinite;">
                <div class="relative mb-4">
                  <div class="wings-system wings-sm silver-wings" [innerHTML]="wingsHtml(3)"></div>
                  <div class="silver-aura"></div>
                  <img [src]="getAvatar(top3()[1].seed)"
                       class="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-3 border-slate-300 relative z-10 bg-slate-800/40 object-cover"
                       style="box-shadow: 0 0 30px rgba(203,213,225,0.3);"
                       alt="Silver">
                  <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl z-20">🥈</div>
                </div>
                <h3 class="text-lg md:text-xl font-bold text-center text-slate-300 uppercase tracking-wide mb-3">{{ top3()[1].alias }}</h3>
                <div class="pedestal-plata w-full rounded-t-2xl text-center py-6 px-3" style="min-height: 140px;">
                  <span class="font-black text-2xl tracking-tighter block" style="color: var(--text-main)">{{ top3()[1].score | number }}</span>
                  <span class="text-xs uppercase font-black mt-2 block" style="color: var(--text-subtle)">{{ top3()[1].steps }}/5 Steps</span>
                </div>
              </div>

              <!-- #1 GOLD -->
              <div class="flex flex-col items-center" style="animation: divine-float 4s infinite;">
                <div class="relative mb-5">
                  <div class="wings-system gold-wings" [innerHTML]="wingsHtml(5)"></div>
                  <div class="god-rays" style="inset: -30%; filter: blur(30px);"></div>
                  <img [src]="getAvatar(top3()[0].seed)"
                       class="w-44 h-44 md:w-56 md:h-56 rounded-3xl border-4 border-yellow-500 relative z-10 bg-indigo-950/30 object-cover"
                       style="box-shadow: 0 0 60px rgba(255,215,0,0.3);"
                       alt="Gold">
                  <div class="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl z-20">👑</div>
                </div>
                <h3 class="text-2xl md:text-3xl font-black text-yellow-500 italic uppercase tracking-tighter text-center mb-4">{{ top3()[0].alias }}</h3>
                <div class="pedestal-divino w-full rounded-t-3xl text-center py-10 px-4 shadow-xl" style="min-height: 200px;">
                  <span class="text-4xl md:text-5xl font-black italic drop-shadow-md tracking-tighter block" style="color: var(--text-main)">{{ top3()[0].score | number }}</span>
                  <span class="text-sm uppercase font-black text-yellow-500/60 mt-3 tracking-[0.2em] block">Integrity Score</span>
                </div>
              </div>

              <!-- #3 BRONZE -->
              <div class="flex flex-col items-center" style="animation: divine-float 7s infinite;">
                <div class="relative mb-4">
                  <div class="wings-system wings-xs bronze-wings" [innerHTML]="wingsHtml(2)"></div>
                  <img [src]="getAvatar(top3()[2].seed)"
                       class="w-28 h-28 md:w-36 md:h-36 rounded-xl border-2 border-orange-700/50 relative z-10 bg-indigo-950/20 object-cover shadow-lg"
                       alt="Bronze">
                  <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl z-20">🥉</div>
                </div>
                <h3 class="text-lg md:text-xl font-bold text-center mb-3" style="color: var(--text-main)">{{ top3()[2].alias }}</h3>
                <div class="pedestal-bronce w-full rounded-t-2xl text-center py-5 px-3" style="min-height: 110px;">
                  <span class="font-black text-orange-400 text-2xl tracking-tighter block">{{ top3()[2].score | number }}</span>
                  <span class="text-xs uppercase font-black mt-2 block" style="color: var(--text-subtle)">Verified Chain</span>
                </div>
              </div>

            </div>
          </div>
        }

        <!-- OTHERS LIST -->
        @if (others().length > 0) {
          <div class="max-w-3xl mx-auto mt-16 space-y-4 px-8">
            <h4 class="text-sm font-black uppercase tracking-[0.4em] text-center mb-8" style="color: var(--text-muted)">Creative Evidence Logs</h4>
            @for (entry of others(); track entry.address) {
              <div class="flex items-center justify-between p-5 md:p-6 rounded-2xl border transition-all group backdrop-blur-md"
                   style="background: var(--card-bg); border-color: var(--card-border);">
                <div class="flex items-center space-x-4">
                  <span class="font-black w-8 text-base" style="color: var(--text-subtle)">#{{ entry.rank }}</span>
                  <img [src]="getAvatar(entry.seed)" class="w-14 h-14 rounded-xl bg-black/20" [alt]="entry.alias">
                  <div>
                    <span class="font-bold uppercase tracking-tight text-base group-hover:text-purple-400 transition-colors" style="color: var(--text-main)">{{ entry.alias }}</span>
                    <div class="flex space-x-1.5 mt-2">
                      @for (s of [0,1,2,3,4]; track s) {
                        <div class="w-4 h-1.5 rounded-full" [class]="s < entry.steps ? 'bg-green-500' : 'bg-white/10'"></div>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-xl font-black italic" style="color: var(--text-main)">{{ entry.score | number }}</span>
                  <button class="text-xs uppercase font-bold transition-opacity mt-1" style="color: var(--text-subtle)">Ver Certificado</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- FEATURES: QUE OFRECE 0xSonata -->
        <div class="max-w-6xl mx-auto mt-24 px-8">
          <h2 class="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-center mb-3" style="color: var(--text-main)">
            ¿Que ofrece 0xSonata?
          </h2>
          <p class="text-center text-base mb-12" style="color: var(--text-muted)">
            Cuatro capas de proteccion para tu musica
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

        <!-- PERSONAS: CASOS DE USO -->
        <div class="max-w-5xl mx-auto mt-24 px-8 pb-24">
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
          <div class="p-10 md:p-14 rounded-3xl border backdrop-blur-2xl shadow-2xl relative overflow-hidden"
               style="background: var(--card-bg); border-color: var(--border-color);">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <h2 class="text-3xl font-black uppercase mb-3 italic tracking-tighter" style="color: var(--text-main)">Chain of Evidence</h2>
            <p class="text-sm mb-10 font-bold uppercase tracking-widest" style="color: var(--text-subtle)">Documenta el control humano en tu proceso creativo</p>

            <div class="space-y-6">
              <div class="space-y-3">
                <label class="text-sm font-black uppercase ml-2" style="color: var(--text-subtle)">Nombre del Proyecto</label>
                <input #regName placeholder="Ej: Neon Reggaeton"
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
                    <span class="text-sm font-black uppercase tracking-widest">{{ step.label }}</span>
                    <span class="text-base">{{ isStepComplete(step.id) ? '✓' : '⚡' }}</span>
                  </button>
                }
              </div>

              <div class="p-5 rounded-xl" style="background: rgba(168,85,247,0.05); border: 1px solid rgba(168,85,247,0.1);">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-black uppercase" style="color: var(--text-subtle)">Integridad</span>
                  <span class="text-base font-black italic"
                        [class]="completedSteps().length >= 3 ? 'text-green-500' : 'text-yellow-500'">
                    {{ completedSteps().length < 3 ? 'DÉBIL' : 'FUERTE' }}
                  </span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--badge-bg);">
                  <div class="h-full bg-purple-500 transition-all duration-500"
                       [style.width.%]="(completedSteps().length / 5) * 100"></div>
                </div>
              </div>

              <button routerLink="/mint"
                      class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-xl font-black uppercase text-white text-base hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-purple-900/40">
                Sellar Proceso en zkSYS
              </button>
            </div>
          </div>
        </div>
      }
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
  activeGuide = signal(0);

  guideSteps = [
    { step: 1, icon: '🎵', title: 'Sube tu audio', description: 'Sube tu beat, melodia o composicion. Se calcula un hash SHA-256 unico que identifica tu obra. Este hash se registra en blockchain como prueba inmutable de autoria.' },
    { step: 2, icon: '⛓️', title: 'Documenta el proceso', description: 'Registra cada paso de tu proceso creativo: prompt, variaciones IA, seleccion, edicion DAW y master final. Cada paso queda sellado on-chain.' },
    { step: 3, icon: '✅', title: 'Verificacion social', description: 'Otros artistas verifican tu trabajo depositando stake. Mas verificaciones = mayor puntaje y nivel (Emergente, Bronce, Plata, Oro).' },
    { step: 4, icon: '📜', title: 'Certificado PDF', description: 'Descarga un certificado PDF con prueba completa de autoria: hash, pasos, verificaciones, tier y links al explorador blockchain.' },
  ];

  features = [
    {
      icon: '⛓️',
      title: 'Creative Process Chain',
      description: 'Registra cada paso de tu proceso creativo (prompt IA, variaciones, seleccion, edicion DAW, master final). Cada paso genera un hash SHA-256 con timestamp en blockchain. Tu cadena de evidencia es publica e inmutable.',
    },
    {
      icon: '🔐',
      title: 'Verificacion con Stake',
      description: 'Otros artistas verifican tu trabajo depositando tokens como garantia. Si verifican contenido fraudulento, pierden su stake. Esto crea un sistema de verificacion con consecuencias reales.',
    },
    {
      icon: '🏆',
      title: 'Reputacion y Tiers',
      description: 'Acumula puntaje por registros, verificaciones y antigüedad. Sube de nivel: Emergente → Bronce → Plata → Oro. Tu tier refleja tu compromiso y credibilidad como artista.',
    },
    {
      icon: '💰',
      title: 'Project Vault + Revenue Share',
      description: 'Agrupa obras en proyectos colaborativos con splits definidos (ej: 40%-60%). El smart contract distribuye automaticamente los pagos segun los porcentajes. Sin ambiguedad, sin intermediarios.',
    },
  ];

  personas = [
    {
      name: 'Valeria',
      location: 'Lima, 22 años',
      emoji: '🎤',
      gradient: 'from-pink-500 to-purple-600',
      problem_title: 'Le robaron su beat y no puede probarlo',
      problem: 'Estudia comunicaciones y usa Suno para crear beats de reggaeton. Publico 3 canciones en SoundCloud con 15,000 reproducciones. Encontro su beat en un TikTok con 200K views. El creador nunca le pidio permiso. No puede hacer nada porque no tiene copyright ni prueba de autoria.',
      solution: 'Registra cada paso (prompt en Suno, las 10 variaciones, su seleccion, edicion en GarageBand, master final). Cada paso tiene hash y timestamp on-chain. Descarga un certificado PDF con toda la cadena de evidencia como prueba de anterioridad.',
    },
    {
      name: 'Diego',
      location: 'Bogota, 28 años',
      emoji: '🎹',
      gradient: 'from-blue-500 to-indigo-600',
      problem_title: 'Registrar copyright es imposiblemente caro',
      problem: 'Productor de trap que usa Udio para bases instrumentales. Quiere registrar en la Direccion Nacional de Derechos de Autor (DNDA) de Colombia, pero cada registro cuesta ~$30 USD y tarda semanas. Produce 4 beats por semana: $480 USD/mes, imposible para un artista emergente.',
      solution: 'Registra cada produccion por el costo del gas en zkSYS (~centavos). Tiene historial publico de 200+ ideas. Cuando un sello pide prueba de autoria, muestra su perfil con verificaciones y certificados. El sello verifica las transacciones en el explorer.',
    },
    {
      name: 'Camila & Andres',
      location: 'Buenos Aires, 25 y 30 años',
      emoji: '🤝',
      gradient: 'from-green-500 to-teal-600',
      problem_title: 'Colaboracion sin acuerdo claro de ownership',
      problem: 'Camila escribe letras y Andres genera instrumentales con IA. Publicaron un EP de 5 tracks pero nunca dejaron claro quien hizo que. Ahora Andres quiere usar 2 tracks para un proyecto solista y Camila dice que no puede porque ella escribio las letras.',
      solution: 'Cada uno registra su contribucion por separado. Luego crean un Project Vault con splits definidos (Camila 40%, Andres 60%). El smart contract distribuye automaticamente cualquier pago futuro. No hay ambiguedad.',
    },
  ];

  top3 = computed(() => this.entries().slice(0, 3));
  others = computed(() => this.entries().slice(3));

  creativeSteps = [
    { id: 0, label: 'Prompt Inicial (Suno/Udio)' },
    { id: 1, label: 'Variaciones Generadas' },
    { id: 2, label: 'Selección Creativa' },
    { id: 3, label: 'Edición DAW (Ableton/FL)' },
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
    this.apiService.getLeaderboard().subscribe({
      next: (data) => {
        const display: DisplayEntry[] = data.map((e) => ({
          ...e,
          seed: e.alias || e.address,
          steps: Math.min(e.totalMints + 1, 5),
          tierClass: e.tier >= 3 ? 'gold' : e.tier >= 2 ? 'silver' : e.tier >= 1 ? 'bronze' : 'emergent',
        }));
        this.entries.set(display);
      },
      error: () => {
        this.entries.set(this.getFallbackData());
      },
    });
  }

  private getFallbackData(): DisplayEntry[] {
    return [
      { rank: 1, address: '0x...VA01', alias: 'Valeria_FL', totalMints: 5, totalVerificationsReceived: 8, tier: 1, tierLabel: 'Bronce', score: 4200, isSeed: true, seed: 'valeria', steps: 5, tierClass: 'gold' },
      { rank: 2, address: '0x...DI02', alias: 'Diego_Prod', totalMints: 3, totalVerificationsReceived: 4, tier: 0, tierLabel: 'Emergente', score: 2800, isSeed: true, seed: 'diego', steps: 4, tierClass: 'silver' },
      { rank: 3, address: '0x...AN03', alias: 'Andres_M', totalMints: 2, totalVerificationsReceived: 2, tier: 0, tierLabel: 'Emergente', score: 1500, isSeed: true, seed: 'andres', steps: 3, tierClass: 'bronze' },
      { rank: 4, address: '0x...CA04', alias: 'Camila_AI', totalMints: 1, totalVerificationsReceived: 1, tier: 0, tierLabel: 'Emergente', score: 800, isSeed: true, seed: 'camila', steps: 2, tierClass: 'emergent' },
    ];
  }

  getAvatar(seed: string): string {
    const bgSet = this.isDarkMode() ? 'bg2' : 'bg1';
    return `https://robohash.org/${encodeURIComponent(seed)}.png?set=set1&bgset=${bgSet}`;
  }

  toggleGuide(step: number) {
    this.activeGuide.set(this.activeGuide() === step ? 0 : step);
  }

  toggleTheme() {
    this.isDarkMode.update((v) => !v);
    document.body.classList.toggle('light-mode', !this.isDarkMode());
  }

  setView(view: 'leaderboard' | 'register') {
    this.currentView.set(view);
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
