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
            0xSonata registra cada paso de tu proceso creativo en blockchain, generando prueba inmutable 
            de autoría con timestamp. No detecta plagio automáticamente, pero te da la prueba legal que 
            necesitas para reclamar autoría.
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
    { id: 'copyright', name: 'Copyright', icon: '©️' },
    { id: 'audio', name: 'Audio Fingerprint', icon: '🎵' },
    { id: 'legal', name: 'Legal', icon: '⚖️' },
    { id: 'blockchain', name: 'Blockchain', icon: '⛓️' },
  ];

  tools: Tool[] = [
    {
      name: 'ACRCloud',
      description: 'Reconocimiento de audio profesional. Detecta canciones, grabaciones y contenido musical en segundos. Usado por Shazam y empresas grandes.',
      url: 'https://www.acrcloud.com/',
      icon: '🎯',
      category: 'audio',
    },
    {
      name: 'AudD',
      description: 'API de identificación musical. Detecta canciones en tiempo real, encuentra plagios y contenido no autorizado en videos.',
      url: 'https://audd.io/',
      icon: '🔍',
      category: 'audio',
    },
    {
      name: 'Music21',
      description: 'Toolkit de Python para análisis musicológico. Compara melodías, acordes y estructuras musicales. Ideal para investigación.',
      url: 'https://web.mit.edu/music21/',
      icon: '🎼',
      category: 'audio',
    },
    {
      name: 'Copyright.gov (USA)',
      description: 'Registro oficial de derechos de autor de EE.UU. Proceso tradicional con validez legal completa en territorio estadounidense.',
      url: 'https://www.copyright.gov/',
      icon: '🏛️',
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
      name: 'Safe Creative',
      description: 'Registro de propiedad intelectual online. Emite certificados con validez legal en múltiples países.',
      url: 'https://www.safecreative.org/',
      icon: '🛡️',
      category: 'legal',
    },
    {
      name: 'Syscoin Platform',
      description: 'Plataforma oficial de Syscoin. Explora el ecosistema, bridge entre cadenas, y herramientas nativas de la red.',
      url: 'https://syscoin.org/',
      icon: '🪙',
      category: 'blockchain',
    },
    {
      name: 'Syscoin Explorer (PoB Devnet)',
      description: 'Explorador de bloques de la red zkSYS PoB Devnet. Verifica transacciones, contratos y NFTs de 0xSonata.',
      url: 'https://explorer-pob.dev11.top/',
      icon: '🔍',
      category: 'blockchain',
    },
    {
      name: 'Pali Wallet',
      description: 'Wallet oficial del ecosistema Syscoin. Conecta con 0xSonata para registrar y verificar ideas musicales.',
      url: 'https://palicrypto.com/',
      icon: '👛',
      category: 'blockchain',
    },
    {
      name: 'Syscoin Faucet',
      description: 'Obtén SYS de testnet/devnet gratis para probar 0xSonata sin gastar fondos reales.',
      url: 'https://faucet-pob.dev11.top/',
      icon: '🚰',
      category: 'blockchain',
    },
    {
      name: 'Bridge Syscoin',
      description: 'Bridge oficial para mover activos entre Ethereum y Syscoin. Útil para tokenizar y mover NFTs.',
      url: 'https://bridge.syscoin.org/',
      icon: '🌉',
      category: 'blockchain',
    },
    {
      name: 'Berkli',
      description: 'Plataforma de gestión de derechos para artistas independientes. Registro y monetización de obras.',
      url: 'https://berkli.com/',
      icon: '📊',
      category: 'copyright',
    },
    {
      name: 'Songtrust',
      description: 'Recolección de regalías globales. Recupera dinero de streaming, radio y usos públicos de tu música.',
      url: 'https://www.songtrust.com/',
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
      copyright: 'bg-blue-500/20 text-blue-400',
      audio: 'bg-green-500/20 text-green-400',
      legal: 'bg-purple-500/20 text-purple-400',
      blockchain: 'bg-orange-500/20 text-orange-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      copyright: 'Copyright',
      audio: 'Audio Fingerprint',
      legal: 'Legal',
      blockchain: 'Blockchain',
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
