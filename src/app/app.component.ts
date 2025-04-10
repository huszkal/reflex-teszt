import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, NgIf, MatToolbarModule, MatButtonModule, RouterLink]
})
export class AppComponent {
  constructor(private authService: AuthService) {}

  get currentUserEmail(): string | null {
    return this.authService.currentUser?.email ?? null;
  }

  logout() {
    this.authService.logout();
  }
}
