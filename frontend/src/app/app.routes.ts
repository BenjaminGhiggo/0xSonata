import { Routes } from '@angular/router';
import { Leaderboard } from './features/leaderboard/leaderboard';
import { Mint } from './features/mint/mint';
import { Verify } from './features/verify/verify';

export const routes: Routes = [
  { path: '', component: Leaderboard, pathMatch: 'full' },
  { path: 'mint', component: Mint },
  { path: 'verify', component: Verify },
  { path: '**', redirectTo: '' },
];
