import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService, LeaderboardEntry } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';

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
      <nav class="flex flex-wrap items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-4 sticky top-0 z-50 backdrop-blur-xl border-b gap-3"
           style="background: var(--bg-nav); border-color: var(--border-color);">
        <div class="flex items-center gap-3">
          <a routerLink="/" class="flex items-center space-x-3 no-underline cursor-pointer">
            <div class="logo">
              <span class="logo-icon" style="font-size: 1.6rem;">&#119070;</span>
              <span class="logo-text" style="font-size: 1.1rem;">0xSonata</span>
            </div>
          </a>
          <button (click)="toggleLang()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-black uppercase tracking-wider transition-all hover:border-purple-500/50 shrink-0 cursor-pointer"
                  style="background: var(--badge-bg); border-color: var(--border-color);"
                  [title]="i18n.isEnglish() ? 'Cambiar a español' : 'Switch to English'">
            <span class="transition-all" [class]="!i18n.isEnglish() ? 'text-purple-400' : ''" [style.color]="i18n.isEnglish() ? 'var(--text-subtle)' : ''">ES</span>
            <span class="w-[2px] h-4 rounded-full" style="background: var(--border-color)"></span>
            <span class="transition-all" [class]="i18n.isEnglish() ? 'text-purple-400' : ''" [style.color]="!i18n.isEnglish() ? 'var(--text-subtle)' : ''">EN</span>
          </button>
        </div>
        <div class="flex items-center flex-wrap justify-end gap-2 md:gap-3">
          <div class="flex items-center flex-wrap gap-1 md:gap-2">
            <button (click)="setView('leaderboard')"
                    class="text-xs sm:text-sm font-black uppercase tracking-widest transition-colors pb-1 whitespace-nowrap"
                    [style.color]="currentView() === 'leaderboard' ? 'var(--text-main)' : 'var(--text-subtle)'"
                    [style.border-bottom]="currentView() === 'leaderboard' ? '2px solid #a855f7' : '2px solid transparent'">
              {{ i18n.t('nav.ranking') }}
            </button>
            <button (click)="setView('register')"
                    class="text-xs sm:text-sm font-black uppercase tracking-widest transition-colors pb-1 whitespace-nowrap"
                    [style.color]="currentView() === 'register' ? 'var(--text-main)' : 'var(--text-subtle)'"
                    [style.border-bottom]="currentView() === 'register' ? '2px solid #a855f7' : '2px solid transparent'">
              {{ i18n.t('nav.register') }}
            </button>
            <a routerLink="/mint"
               class="text-xs sm:text-sm font-black uppercase tracking-widest transition-colors no-underline pb-1 whitespace-nowrap"
               style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
              {{ i18n.t('nav.createNft') }}
            </a>
            <a routerLink="/verify"
               class="text-xs sm:text-sm font-black uppercase tracking-widest transition-colors no-underline pb-1 whitespace-nowrap"
               style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
              {{ i18n.t('nav.verify') }}
            </a>
            <a routerLink="/tools"
               class="text-xs sm:text-sm font-black uppercase tracking-widest transition-colors no-underline pb-1 whitespace-nowrap"
               style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
              {{ i18n.t('nav.tools') }}
            </a>
          </div>
          <div class="h-5 w-[1px] md:h-6" style="background: var(--border-color)"></div>
          <button (click)="toggleTheme()"
                  class="p-2 rounded-lg border hover:opacity-80 transition-all text-base md:text-lg shrink-0"
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
            {{ i18n.t('hero.title') }}
          </h1>
          <p class="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style="color: var(--text-muted)">
            {{ i18n.t('hero.subtitle') }}
          </p>
        </div>

        <!-- H6: COMO FUNCIONA — Pasos SIEMPRE visibles con descripciones, no escondidos en tooltips -->
        <div class="max-w-4xl mx-auto mt-10 px-8">
          <h2 class="text-sm font-black uppercase tracking-[0.3em] text-center mb-6" style="color: var(--text-subtle)">{{ i18n.t('howItWorks.title') }}</h2>
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
              {{ i18n.t('cta.startRegistration') }}
            </a>
            <a routerLink="/verify"
               class="px-8 py-4 rounded-xl border font-bold text-sm hover:opacity-80 transition-all no-underline"
               style="background: var(--card-bg); border-color: var(--border-color); color: var(--text-muted);">
              {{ i18n.t('cta.verifyIdea') }}
            </a>
          </div>
        </div>

        <!-- AI MUSIC SUCCESS STORIES -->
        <div class="max-w-4xl mx-auto mt-14 px-8">
          <h2 class="text-sm font-black uppercase tracking-[0.3em] text-center mb-2" style="color: var(--text-subtle)">{{ i18n.t('stories.title') }}</h2>
          <p class="text-center text-xs mb-8" style="color: var(--text-muted)">{{ i18n.t('stories.subtitle') }}</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

            <!-- Emma -->
            <div class="p-6 rounded-2xl border transition-all hover:border-purple-500/40 hover:-translate-y-1"
                 style="background: var(--card-bg); border-color: var(--card-border);">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-lg">🎤</div>
                <div>
                  <div class="text-sm font-black uppercase" style="color: var(--text-main)">Emma</div>
                  <div class="text-xs" style="color: var(--text-muted)">{{ i18n.t('stories.emma.genre') }}</div>
                </div>
              </div>
              <div class="text-2xl font-black italic tracking-tighter mb-2" style="background: linear-gradient(135deg,#a855f7,#6366f1); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">$1,200 USD</div>
              <p class="text-xs leading-relaxed mb-3" style="color: var(--text-muted)">{{ i18n.t('stories.emma.desc') }}</p>
              <a href="https://www.remiforartists.com/post/how-to-make-money-with-ai-music-in-2026-without-getting-sued" target="_blank" rel="noopener"
                 class="text-xs no-underline opacity-50 hover:opacity-100 transition-opacity" style="color:var(--text-subtle)">Remi for Artists, Dec 2025 ↗</a>
            </div>

            <!-- CENTRAL: AI Music Market 2025 -->
            <div class="p-6 rounded-2xl border transition-all hover:border-purple-500/40 hover:-translate-y-1 ring-1 ring-purple-500/20"
                 style="background: var(--card-bg); border-color: var(--card-border);">
              <div class="flex items-center justify-center gap-2 mb-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center text-lg">💰</div>
              </div>
              <div class="text-center">
                <div class="text-3xl md:text-4xl font-black italic tracking-tighter mb-1" style="background: linear-gradient(135deg,#a855f7,#ec4899,#f97316); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">$6.65B</div>
                <div class="text-xs font-black uppercase tracking-wider mb-2" style="color: var(--text-main)">{{ i18n.t('stories.market.label') }}</div>
                <p class="text-xs leading-relaxed mb-3" style="color: var(--text-muted)">{{ i18n.t('stories.market.desc') }}</p>
                <a href="https://market.us/report/ai-in-music-market/" target="_blank" rel="noopener"
                   class="text-xs no-underline opacity-50 hover:opacity-100 transition-opacity" style="color:var(--text-subtle)">Market.us Analytics, 2025 ↗</a>
              </div>
            </div>

            <!-- Luna -->
            <div class="p-6 rounded-2xl border transition-all hover:border-purple-500/40 hover:-translate-y-1"
                 style="background: var(--card-bg); border-color: var(--card-border);">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">🎵</div>
                <div>
                  <div class="text-sm font-black uppercase" style="color: var(--text-main)">Luna</div>
                  <div class="text-xs" style="color: var(--text-muted)">{{ i18n.t('stories.luna.genre') }}</div>
                </div>
              </div>
              <div class="text-2xl font-black italic tracking-tighter mb-2" style="background: linear-gradient(135deg,#10b981,#6366f1); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">NFTs</div>
              <p class="text-xs leading-relaxed mb-3" style="color: var(--text-muted)">{{ i18n.t('stories.luna.desc') }}</p>
              <a href="https://www.remiforartists.com/post/how-to-make-money-with-ai-music-in-2026-without-getting-sued" target="_blank" rel="noopener"
                 class="text-xs no-underline opacity-50 hover:opacity-100 transition-opacity" style="color:var(--text-subtle)">Remi for Artists, Dec 2025 ↗</a>
            </div>

          </div>
        </div>

        <!-- H1: LOADING STATE -->
        @if (isLoading()) {
          <div class="max-w-5xl mx-auto px-8 mt-16 text-center">
            <div class="inline-block w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p class="text-sm mt-3" style="color: var(--text-muted)">{{ i18n.t('loading.ranking') }}</p>
          </div>
        }

        <!-- TOP 3 PODIO -->
        @if (!isLoading() && top3().length >= 3) {
          <div class="max-w-5xl mx-auto px-8 mt-16">
            <div class="flex items-center justify-center gap-2 mb-4">
              <h2 class="text-sm font-black uppercase tracking-[0.3em]" style="color: var(--text-subtle)">{{ i18n.t('leaderboard.topArtists') }}</h2>
              <button (click)="openInfoModal('leaderboard')"
                      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:bg-purple-500/20 cursor-pointer"
                      style="color: var(--text-muted); border: 1px solid var(--border-color);"
                      [title]="i18n.t('modal.leaderboard.title')">
                ℹ️
              </button>
            </div>
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
                  <div class="flex items-center justify-center gap-1 mt-2">
                    <span class="text-xs uppercase font-black" style="color: var(--text-subtle)">{{ i18n.t('leaderboard.integrityScore') }}</span>
                    <button (click)="openInfoModal('score'); $event.stopPropagation()" class="text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer">ℹ️</button>
                  </div>
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
                  <div class="flex items-center justify-center gap-1 mt-3">
                    <span class="text-sm uppercase font-black tracking-[0.2em]" style="color: var(--text-subtle)">{{ i18n.t('leaderboard.integrityScore') }}</span>
                    <button (click)="openInfoModal('score'); $event.stopPropagation()" class="text-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer">ℹ️</button>
                  </div>
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
                  <div class="flex items-center justify-center gap-1 mt-2">
                    <span class="text-xs uppercase font-black" style="color: var(--text-subtle)">{{ i18n.t('leaderboard.integrityScore') }}</span>
                    <button (click)="openInfoModal('score'); $event.stopPropagation()" class="text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer">ℹ️</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        }

        <!-- LISTA DE OTROS ARTISTAS -->
        @if (!isLoading() && others().length > 0) {
          <div class="max-w-3xl mx-auto mt-16 px-8">
            <h4 class="text-sm font-black uppercase tracking-[0.3em] text-center mb-8" style="color: var(--text-muted)">{{ i18n.t('leaderboard.otherArtists') }}</h4>
            <div class="rounded-2xl border overflow-hidden" style="border-color: var(--border-color); background: var(--card-bg);">
              <div class="overflow-y-auto space-y-0" style="max-height: 400px; scrollbar-width: thin; scrollbar-color: rgba(168,85,247,0.3) transparent;">
                @for (entry of others(); track entry.address) {
                  <div class="flex items-center justify-between p-5 md:p-6 transition-all group border-b last:border-b-0"
                       style="border-color: var(--border-color);">
                    <div class="flex items-center space-x-4">
                      <span class="font-black w-8 text-base" style="color: var(--text-subtle)">#{{ entry.rank }}</span>
                      <img [src]="getAvatar(entry.seed)" class="w-14 h-14 rounded-xl bg-black/20" [alt]="'Avatar de ' + entry.alias">
                      <span class="font-bold uppercase tracking-tight text-base group-hover:text-purple-400 transition-colors" style="color: var(--text-main)">{{ entry.alias }}</span>
                    </div>
                    <div class="flex flex-col items-end">
                      <span class="text-xl font-black italic" style="color: var(--text-main)">{{ entry.score | number }}</span>
                      <span class="text-xs uppercase font-bold mt-1" style="color: var(--text-subtle)">{{ i18n.t('leaderboard.integrityScore') }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- H1: Estado vacio explicito -->
        @if (!isLoading() && entries().length === 0) {
          <div class="max-w-2xl mx-auto mt-16 px-8 text-center">
            <div class="text-5xl mb-4">🎵</div>
            <p class="text-lg font-bold" style="color: var(--text-main)">{{ i18n.t('leaderboard.noArtists') }}</p>
            <p class="text-sm mt-2" style="color: var(--text-muted)">{{ i18n.t('leaderboard.beFirst') }}</p>
            <a routerLink="/mint"
               class="inline-block mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm no-underline">
              {{ i18n.t('cta.startRegistration') }}
            </a>
          </div>
        }

        <!-- QUE OFRECE 0xSonata -->
        <div class="max-w-6xl mx-auto mt-24 px-8">
          <h2 class="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-center mb-3" style="color: var(--text-main)">
            {{ i18n.t('features.title') }}
          </h2>
          <p class="text-center text-base mb-12" style="color: var(--text-muted)">
            {{ i18n.t('features.subtitle') }}
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
            {{ i18n.t('personas.title') }}
          </h2>
          <p class="text-center text-base mb-12" style="color: var(--text-muted)">
            {{ i18n.t('personas.subtitle') }}
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
                        <span class="text-purple-500">{{ i18n.t('personas.with0xSonata') }}</span>{{ persona.solution }}
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
              <span class="text-sm font-bold" style="color: var(--text-muted)">{{ i18n.t('footer.chain') }}</span>
            </div>
            <nav class="flex items-center gap-6 text-sm" style="color: var(--text-subtle);">
              <button (click)="setView('leaderboard')" class="hover:text-purple-400 transition-colors">{{ i18n.t('nav.ranking') }}</button>
              <a routerLink="/mint" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">{{ i18n.t('nav.createNft') }}</a>
              <a routerLink="/verify" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">{{ i18n.t('nav.verify') }}</a>
              <a routerLink="/tools" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">{{ i18n.t('nav.tools') }}</a>
              <a href="https://explorer-pob.dev11.top" target="_blank" rel="noopener noreferrer"
                 class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">Explorer ↗</a>
            </nav>
          </div>
          <p class="text-center text-xs mt-6" style="color: var(--text-subtle)">
            {{ i18n.t('footer.network') }}
          </p>
        </div>
      </footer>

      <!-- MODAL INFO -->
      @if (infoModalOpen()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" (click)="closeInfoModal()">
          <div class="relative max-w-lg w-full p-6 rounded-2xl border shadow-2xl"
               style="background: var(--card-bg); border-color: var(--border-color);"
               (click)="$event.stopPropagation()">
            <button (click)="closeInfoModal()"
                    class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:bg-red-500/20 cursor-pointer"
                    style="color: var(--text-muted); border: 1px solid var(--border-color);">
              ✕
            </button>

            @if (infoModalType() === 'leaderboard') {
              <h3 class="text-xl font-black uppercase mb-4" style="color: var(--text-main)">{{ i18n.t('modal.leaderboard.title') }}</h3>
              <div class="text-sm leading-relaxed space-y-3" style="color: var(--text-muted)">
                <p>{{ i18n.t('modal.leaderboard.p1') }}</p>
                <p>{{ i18n.t('modal.leaderboard.p2') }}</p>
                <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p class="text-purple-300"><strong>{{ i18n.t('modal.leaderboard.purpose') }}</strong></p>
                  <ul class="list-disc list-inside text-xs space-y-1 mt-2" style="color: var(--text-muted)">
                    <li>{{ i18n.t('modal.leaderboard.item1') }}</li>
                    <li>{{ i18n.t('modal.leaderboard.item2') }}</li>
                    <li>{{ i18n.t('modal.leaderboard.item3') }}</li>
                    <li>{{ i18n.t('modal.leaderboard.item4') }}</li>
                  </ul>
                </div>
              </div>
            }

            @if (infoModalType() === 'score') {
              <h3 class="text-xl font-black uppercase mb-4" style="color: var(--text-main)">{{ i18n.t('modal.score.title') }}</h3>
              <div class="text-sm leading-relaxed space-y-3" style="color: var(--text-muted)">
                <p>{{ i18n.t('modal.score.p1') }}</p>
                <div class="p-4 rounded-xl border font-mono text-center" style="background: var(--input-bg); border-color: var(--border-color);">
                  <p class="text-lg font-black" style="color: var(--text-main)">{{ i18n.t('modal.score.formula') }}</p>
                </div>
                <div class="space-y-2 mt-2">
                  <div class="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <span class="text-xl">🎵</span>
                    <div>
                      <p class="font-bold text-purple-300">{{ i18n.t('modal.score.mints') }}</p>
                      <p class="text-xs">{{ i18n.t('modal.score.mintsDesc') }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span class="text-xl">✅</span>
                    <div>
                      <p class="font-bold text-green-300">{{ i18n.t('modal.score.verifRecv') }}</p>
                      <p class="text-xs">{{ i18n.t('modal.score.verifRecvDesc') }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span class="text-xl">🔍</span>
                    <div>
                      <p class="font-bold text-blue-300">{{ i18n.t('modal.score.verifGiven') }}</p>
                      <p class="text-xs">{{ i18n.t('modal.score.verifGivenDesc') }}</p>
                    </div>
                  </div>
                </div>
              </div>
            }

            <button (click)="closeInfoModal()"
                    class="w-full mt-6 p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm hover:brightness-110 transition-all cursor-pointer">
              {{ i18n.t('modal.understood') }}
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class Leaderboard implements OnInit {
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private themeService = inject(ThemeService);
  readonly i18n = inject(LanguageService);

  // Usar el signal del servicio compartido
  isDarkMode = computed(() => this.themeService.isDarkMode());
  currentView = signal<'leaderboard' | 'register'>('leaderboard');
  entries = signal<DisplayEntry[]>([]);
  completedSteps = signal<number[]>([]);
  isLoading = signal(true);
  infoModalOpen = signal(false);
  infoModalType = signal<'leaderboard' | 'score'>('leaderboard');

  get guideSteps() {
    return [
      { step: 1, icon: '🤖', title: this.i18n.t('howItWorks.step1.title'), description: this.i18n.t('howItWorks.step1.desc') },
      { step: 2, icon: '✍️', title: this.i18n.t('howItWorks.step2.title'), description: this.i18n.t('howItWorks.step2.desc') },
      { step: 3, icon: '⛓️', title: this.i18n.t('howItWorks.step3.title'), description: this.i18n.t('howItWorks.step3.desc') },
      { step: 4, icon: '📜', title: this.i18n.t('howItWorks.step4.title'), description: this.i18n.t('howItWorks.step4.desc') },
    ];
  }

  get features() {
    return [
      { icon: '🤖', title: this.i18n.t('features.f1.title'), description: this.i18n.t('features.f1.desc') },
      { icon: '🔐', title: this.i18n.t('features.f2.title'), description: this.i18n.t('features.f2.desc') },
      { icon: '🏆', title: this.i18n.t('features.f3.title'), description: this.i18n.t('features.f3.desc') },
      { icon: '🤝', title: this.i18n.t('features.f4.title'), description: this.i18n.t('features.f4.desc') },
    ];
  }

  get personas() {
    return [
      {
        name: 'Jake', location: 'Lima, 22', emoji: '🎤', gradient: 'from-pink-500 to-purple-600',
        problem_title: this.i18n.t('persona.jake.problem_title'),
        problem: this.i18n.t('persona.jake.problem'),
        solution: this.i18n.t('persona.jake.solution'),
      },
      {
        name: 'Valeria', location: 'CDMX, 26', emoji: '🎹', gradient: 'from-blue-500 to-indigo-600',
        problem_title: this.i18n.t('persona.valeria.problem_title'),
        problem: this.i18n.t('persona.valeria.problem'),
        solution: this.i18n.t('persona.valeria.solution'),
      },
      {
        name: 'Andrés & Camila', location: 'Buenos Aires, 25 & 28', emoji: '🤝', gradient: 'from-green-500 to-teal-600',
        problem_title: this.i18n.t('persona.collab.problem_title'),
        problem: this.i18n.t('persona.collab.problem'),
        solution: this.i18n.t('persona.collab.solution'),
      },
    ];
  }

  top3 = computed(() => this.entries().slice(0, 3));
  others = computed(() => this.entries().slice(3));

  get creativeSteps() {
    return [
      { id: 0, label: this.i18n.t('step.0') },
      { id: 1, label: this.i18n.t('step.1') },
      { id: 2, label: this.i18n.t('step.2') },
      { id: 3, label: this.i18n.t('step.3') },
      { id: 4, label: this.i18n.t('step.4') },
    ];
  }

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
    const bgSet = this.themeService.isDarkMode() ? 'bg2' : 'bg1';
    return `https://robohash.org/${encodeURIComponent(seed)}.png?set=set1&bgset=${bgSet}`;
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  toggleLang() {
    this.i18n.toggle();
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

  openInfoModal(type: 'leaderboard' | 'score') {
    this.infoModalType.set(type);
    this.infoModalOpen.set(true);
  }

  closeInfoModal() {
    this.infoModalOpen.set(false);
  }
}
