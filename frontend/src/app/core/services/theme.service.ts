// POR QUE: El tema (oscuro/claro) debe ser global y persistente.
//   Sin un servicio compartido, cada componente tiene su propio estado
//   y al navegar entre rutas el tema se desincroniza o se reinicia.
//
// QUE: Servicio singleton que gestiona:
//   - Estado del tema (oscuro/claro) via signals
//   - Persistencia en localStorage
//   - Aplicacion de la clase CSS al body
//   - Sincronizacion entre todos los componentes
//
// COMO: Usa signals de Angular para reactividad y localStorage para
//   persistencia. Al arrancar, lee el tema guardado. Al cambiar,
//   guarda el nuevo valor y actualiza la clase del body.

import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  // Signal privado para el estado interno
  private isDarkModeSignal = signal(true);
  
  // Signal público de solo lectura
  readonly isDarkMode = computed(() => this.isDarkModeSignal());
  
  constructor() {
    // Al inicializar, cargar el tema guardado
    this.loadTheme();
    
    // Efecto: cada vez que cambia isDarkMode, actualiza el DOM y localStorage
    effect(() => {
      const isDark = this.isDarkModeSignal();
      this.applyThemeToBody(isDark);
      this.saveTheme(isDark);
    });
  }
  
  // Cambia el tema (toggle)
  toggle(): void {
    this.isDarkModeSignal.update(current => !current);
  }
  
  // Establece un tema específico
  setDarkMode(isDark: boolean): void {
    this.isDarkModeSignal.set(isDark);
  }
  
  // Carga el tema desde localStorage
  private loadTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Solo en navegador
    }
    
    try {
      const saved = localStorage.getItem('0xsonata-theme');
      if (saved !== null) {
        const isDark = saved === 'dark';
        this.isDarkModeSignal.set(isDark);
      } else {
        // Por defecto: modo oscuro
        this.isDarkModeSignal.set(true);
      }
    } catch {
      // Si localStorage falla, usar default
      this.isDarkModeSignal.set(true);
    }
  }
  
  // Aplica la clase CSS al body
  private applyThemeToBody(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    if (isDark) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }
  
  // Guarda el tema en localStorage
  private saveTheme(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    try {
      localStorage.setItem('0xsonata-theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignorar errores de localStorage
    }
  }
}
