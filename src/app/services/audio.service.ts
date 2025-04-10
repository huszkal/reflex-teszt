import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  playSound(path: string, volume: number = 0.3, loop: boolean = false): void {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.loop = loop;
    audio.play().catch(err => console.error('Audio play error:', err));
  }
}
