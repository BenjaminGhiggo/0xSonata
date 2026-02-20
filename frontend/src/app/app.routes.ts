// POR QUE: El routing le dice a Angular que componente mostrar para cada URL.
//   Sin routing, todos los componentes estarian en una sola pagina.
//
// QUE: 3 rutas principales:
//   /       -> Home (landing con info y navegacion)
//   /mint   -> Mint (registrar idea musical)
//   /verify -> Verify (verificar idea de otro artista)
//
// COMO: Angular compara la URL actual del navegador con cada 'path'.
//   Cuando encuentra una coincidencia, renderiza el 'component' asociado
//   dentro del <router-outlet> del componente padre (App).
//   pathMatch: 'full' en la ruta '' significa que solo coincide con
//   exactamente "/" y no con "/cualquier-cosa".

import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Mint } from './features/mint/mint';
import { Verify } from './features/verify/verify';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'mint', component: Mint },
  { path: 'verify', component: Verify },
  { path: '**', redirectTo: '' },
];
