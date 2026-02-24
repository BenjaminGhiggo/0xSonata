import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Tool {
  name: string;
  description: string;
  url: string;
  icon: string;
  category: 'copyright' | 'audio' | 'legal' | 'blockchain';
}

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, RouterLink],
  host: { style: 'display: block' },
  template: `
    <div class="min-h-screen transition-all duration-500 flex flex-col"
         [class]="isDarkMode()
           ? 'bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b_0%,#05060b_80%)]'
           : 'bg-[radial-gradient(circle_at_50%_-20%,#e0e7ff_0%,#f8fafc_80%)]'">

      <!-- NAV -->
      <nav class="flex flex-wrap items-center justify-between px-8 md:px-12 py-5 sticky top-0 z-50 backdrop-blur-xl border-b gap-4"
           style="background: var(--bg-nav); border-color: var(--border-color);">
        <a routerLink="/" class="flex items-center space-x-4 no-underline cursor-pointer">
          <div class="logo">
            <span class="logo-icon">&#119070;</span>
            <span class="logo-text">0xSonata</span>
          </div>
        </a>
        <div class="flex items-center space-x-3 md:space-x-6">
          <a routerLink="/leaderboard"
             class="text-sm font-black uppercase tracking-widest transition-colors pb-1"
             style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
            Ranking
          </a>
          <a routerLink="/mint"
             class="text-sm font-black uppercase tracking-widest transition-colors no-underline pb-1"
             style="color: var(--text-subtle); border-bottom: 2px solid transparent;">
            Crear NFT
          </a>
          <a routerLink="/tools"
             class="text-sm font-black uppercase tracking-widest transition-colors pb-1"
             [style.color]="currentView() === 'tools' ? 'var(--text-main)' : 'var(--text-subtle)'"
             [style.border-bottom]="currentView() === 'tools' ? '2px solid #a855f7' : '2px solid transparent'">
            Herramientas
          </a>
          <div class="h-6 w-[1px]" style="background: var(--border-color)"></div>
          <button (click)="toggleTheme()"
                  class="p-2 rounded-lg border hover:opacity-80 transition-all text-lg"
                  style="background: var(--badge-bg); border-color: var(--border-color);">
            {{ isDarkMode() ? '☀️' : '🌙' }}
          </button>
        </div>
      </nav>

      <!-- HERO -->
      <div class="max-w-4xl mx-auto text-center pt-14 px-8">
        <h1 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4" style="color: var(--text-main)">
          Herramientas Externas
        </h1>
        <p class="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style="color: var(--text-muted)">
          0xSonata se especializa en prueba de autoría on-chain. Para otras necesidades, 
          usa estas herramientas recomendadas por la comunidad.
        </p>
      </div>

      <!-- CATEGORIAS -->
      <div class="max-w-6xl mx-auto mt-12 px-8">
        <div class="flex flex-wrap justify-center gap-3 mb-10">
          @for (cat of categories; track cat.id) {
            <button (click)="setCategory(cat.id)"
                    class="px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest transition-all border"
                    [class]="selectedCategory() === cat.id
                      ? 'bg-purple-500 text-white border-purple-500'
                      : ''"
                    [style.background]="selectedCategory() !== cat.id ? 'var(--card-bg)' : ''"
                    [style.border-color]="selectedCategory() !== cat.id ? 'var(--border-color)' : ''"
                    [style.color]="selectedCategory() !== cat.id ? 'var(--text-subtle)' : ''">
              {{ cat.icon }} {{ cat.name }}
            </button>
          }
        </div>
      </div>

      <!-- HERRAMIENTAS -->
      <div class="max-w-6xl mx-auto px-8 pb-20">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (tool of filteredTools(); track tool.name) {
            <a [href]="tool.url" target="_blank" rel="noopener noreferrer"
               class="p-6 rounded-2xl border transition-all group no-underline hover:border-purple-500/50 hover:scale-[1.02]"
               style="background: var(--card-bg); border-color: var(--card-border);">
              <div class="flex items-start gap-4">
                <div class="text-4xl shrink-0 group-hover:scale-110 transition-transform">{{ tool.icon }}</div>
                <div class="flex-1">
                  <h3 class="text-lg font-black uppercase tracking-tight mb-2" style="color: var(--text-main)">
                    {{ tool.name }}
                    <span class="text-xs opacity-50 ml-1">↗</span>
                  </h3>
                  <p class="text-sm leading-relaxed mb-3" style="color: var(--text-muted)">{{ tool.description }}</p>
                  <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        [class]="getCategoryColor(tool.category)">
                    {{ getCategoryLabel(tool.category) }}
                  </span>
                </div>
              </div>
            </a>
          }
        </div>

        @if (filteredTools().length === 0) {
          <div class="text-center py-20">
            <div class="text-5xl mb-4">🔧</div>
            <p class="text-lg font-bold" style="color: var(--text-main)">No hay herramientas en esta categoría</p>
            <p class="text-sm mt-2" style="color: var(--text-muted)">Selecciona otra categoría o vuelve más tarde</p>
          </div>
        }
      </div>

      <!-- INFO BOX -->
      <div class="max-w-4xl mx-auto px-8 pb-20">
        <div class="p-8 rounded-2xl border"
             style="background: rgba(168,85,247,0.05); border-color: rgba(168,85,247,0.2);">
          <h3 class="text-lg font-black uppercase mb-3" style="color: var(--text-main)">
            ¿Qué hace 0xSonata?
          </h3>
          <p class="text-sm leading-relaxed mb-4" style="color: var(--text-muted)">
            0xSonata documenta tu proceso creativo con IA (Suno/Udio) en blockchain. 
            Registra tu prompt, variaciones, selección y ediciones humanas para cumplir 
            con el Copyright Office y proteger tu derecho a monetizar.
          </p>
          <a routerLink="/mint"
             class="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-sm no-underline hover:brightness-110 transition-all">
            Registrar mi proceso →
          </a>
        </div>
      </div>

      <!-- FOOTER -->
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
              <a routerLink="/leaderboard" class="hover:text-purple-400 transition-colors">Ranking</a>
              <a routerLink="/mint" class="hover:text-purple-400 transition-colors no-underline" style="color: var(--text-subtle)">Crear NFT</a>
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
export class Tools {
  isDarkMode = signal(true);
  currentView = signal<'tools'>('tools');
  selectedCategory = signal<string>('all');

  categories = [
    { id: 'all', name: 'Todas', icon: '🔧' },
    { id: 'audio', name: 'IA Musical', icon: '🤖' },
    { id: 'legal', name: 'Copyright', icon: '⚖️' },
    { id: 'blockchain', name: 'Blockchain', icon: '⛓️' },
    { id: 'copyright', name: 'Distribución', icon: '📀' },
  ];

  tools: Tool[] = [
    {
      name: 'Suno AI',
      description: 'Generador de música con IA líder. Crea canciones completas desde prompts de texto. Planes desde $10/mes para uso comercial.',
      url: 'https://suno.com/',
      icon: '🌞',
      category: 'audio',
    },
    {
      name: 'Udio',
      description: 'IA musical de alta calidad. Genera tracks profesionales con control creativo. Ideal para demos y producción asistida.',
      url: 'https://www.udio.com/',
      icon: '🎵',
      category: 'audio',
    },
    {
      name: 'Copyright.gov (USA)',
      description: 'Registro oficial de derechos de autor de EE.UU. Requiere "autoría humana significativa" para música con IA.',
      url: 'https://www.copyright.gov/',
      icon: '🏛️',
      category: 'legal',
    },
    {
      name: 'US Copyright Office: AI Guidance',
      description: 'Guía oficial de Enero 2025 sobre registro de obras con IA. Explica qué es "autoría humana significativa".',
      url: 'https://www.copyright.gov/ai/',
      icon: '📋',
      category: 'legal',
    },
    {
      name: 'WIPO Proof',
      description: 'Servicio de la OMPI para prueba de existencia de archivos. Timestamp oficial con validez internacional.',
      url: 'https://wipoproof.wipo.int/',
      icon: '🌍',
      category: 'legal',
    },
    {
      name: 'Syscoin Platform',
      description: 'Blockchain donde 0xSonata está desplegado. zkSYS PoB Devnet para pruebas con tSYS gratis.',
      url: 'https://syscoin.org/',
      icon: '🪙',
      category: 'blockchain',
    },
    {
      name: 'Syscoin Explorer (PoB Devnet)',
      description: 'Explorador de bloques de la red zkSYS PoB Devnet. Verifica tus registros de proceso creativo.',
      url: 'https://explorer-pob.dev11.top/',
      icon: '🔍',
      category: 'blockchain',
    },
    {
      name: 'Pali Wallet',
      description: 'Wallet oficial del ecosistema Syscoin. Conecta con 0xSonata para registrar tu proceso creativo.',
      url: 'https://palicrypto.com/',
      icon: '👛',
      category: 'blockchain',
    },
    {
      name: 'Syscoin Faucet',
      description: 'Obtén tSYS de testnet gratis para probar 0xSonata sin gastar fondos reales.',
      url: 'https://faucet-pob.dev11.top/',
      icon: '🚰',
      category: 'blockchain',
    },
    {
      name: 'Ableton Live',
      description: 'DAW profesional para editar material de IA. Agrega "autoría humana significativa" con tus ediciones.',
      url: 'https://www.ableton.com/',
      icon: '🎛️',
      category: 'audio',
    },
    {
      name: 'FL Studio',
      description: 'DAW popular para producción musical. Edita stems de Suno/Udio y documenta tu aporte creativo.',
      url: 'https://www.image-line.com/fl-studio/',
      icon: '🎹',
      category: 'audio',
    },
    {
      name: 'DistroKid',
      description: 'Distribuye tu música a Spotify, Apple Music, etc. Acepta música con IA si pruebas autoría humana.',
      url: 'https://distrokid.com/',
      icon: '📀',
      category: 'copyright',
    },
    {
      name: 'TuneCore',
      description: 'Distribución musical + Content ID. Protege tus regalías y monitorea usos no autorizados.',
      url: 'https://www.tunecore.com/',
      icon: '💰',
      category: 'copyright',
    },
  ];

  filteredTools = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.tools;
    return this.tools.filter((t) => t.category === cat);
  });

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      audio: 'bg-purple-500/20 text-purple-400',
      legal: 'bg-blue-500/20 text-blue-400',
      blockchain: 'bg-orange-500/20 text-orange-400',
      copyright: 'bg-green-500/20 text-green-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      audio: 'IA Musical',
      legal: 'Copyright',
      blockchain: 'Blockchain',
      copyright: 'Distribución',
    };
    return labels[category] || category;
  }

  toggleTheme() {
    this.isDarkMode.update((v) => !v);
    document.body.classList.toggle('light-mode', !this.isDarkMode());
  }

  setCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }
}
