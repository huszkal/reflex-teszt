import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    showNotification(message: string, icon?: string) {
      
        let container = document.querySelector('.notification-container');
      
        if (!container) {
          container = document.createElement('div');
          container.className = 'notification-container';
          document.body.appendChild(container);
        }
      
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
          <img src="${icon || '/images/achievements/first-game.png'}" alt="Achievement Icon" />
          <span>${message}</span>
        `;
      
        container.appendChild(notification);
      
        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => notification.remove(), 500);
        }, 3000);
      }
      
}

