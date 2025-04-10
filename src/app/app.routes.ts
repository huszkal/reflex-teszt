import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { GameComponent } from './pages/game/game.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';

export const routes: Routes = [
  { path: '', component: GameComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: '**', redirectTo: '' }
];
