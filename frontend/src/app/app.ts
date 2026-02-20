// POR QUE: El componente raiz (App) es el "contenedor" de toda la aplicacion.
//   Incluye el Header (siempre visible) y el router-outlet (que cambia
//   de contenido segun la URL).
//
// QUE: Componente que renderiza Header + router-outlet + footer.
//
// COMO: RouterOutlet es un componente especial de Angular que sirve como
//   "hueco" donde se insertan los componentes de cada ruta.
//   Cuando la URL cambia de "/" a "/mint", Angular destruye el componente
//   Home y crea el componente Mint dentro del router-outlet.

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  template: `
    <div class="app">
      <app-header />

      <main class="main-content">
        <router-outlet />
      </main>

      <footer class="footer">
        <p>0xSonata -- Registro y tokenizacion de creatividad musical</p>
        <p>Red: zkSYS PoB Devnet (57042)</p>
      </footer>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: radial-gradient(circle at top, #fef3c7 0%, #f4f4ff 40%, #e5e7eb 100%);
    }
    .main-content {
      flex: 1;
      padding: 24px 16px;
    }
    .footer {
      margin-top: auto;
      padding: 24px;
      border-top: 1px solid rgba(148,163,184,0.4);
      background: #fff;
      text-align: center;
      color: #6b7280;
      font-size: 0.85rem;
    }
    .footer p { margin-bottom: 4px; }
  `]
})
export class App {}
