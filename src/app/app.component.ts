import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    NgIf,
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    MatMenuModule
  ]
})
export class AppComponent implements OnInit {
  currentUserEmail: string | null = null;
  title = 'reflex-teszt';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.authResolved$.subscribe(resolved => {
      if (resolved) {
        const lastRoute = localStorage.getItem('lastRoute');
  
        if (lastRoute && lastRoute !== '/login' && lastRoute !== '/register') {
          this.router.navigateByUrl(lastRoute);
        }
  
        this.router.events.pipe(
          filter(event => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
          localStorage.setItem('lastRoute', event.urlAfterRedirects);
        });
  
        // 💡 Itt figyeljük a user streamet, és frissítjük a local változót!
        this.authService.currentUser$.subscribe(user => {
          this.currentUserEmail = user?.email || null;
        });
      }
    });
  }
  
  logout(): void {
    localStorage.removeItem('lastRoute');
    this.authService.logout();
  }
}
