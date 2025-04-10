import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Default route - figyeljük, ha be van jelentkezve vagy sem
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'game' // Ha nem vagyunk belépve, authGuard elintézi!
  },

  // Publikus oldalak
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  // Protected oldalak (authGuard)
  {
    path: 'leaderboard',
    loadComponent: () => import('./pages/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'game',
    loadComponent: () => import('./pages/game/game.component').then(m => m.GameComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  // Fallback route
  {
    path: '**',
    redirectTo: 'game'
  }
];
