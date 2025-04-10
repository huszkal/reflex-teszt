import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [NgIf, NgClass]
})
export class GameComponent {
  signalShown = false;
  waitingForSignal = false;
  gameStarted = false;
  gameEnded = false;
  message = 'Készülj fel a játékra!';
  result = '';
  timer: any;
  startTime = 0;
  endTime = 0;
  randomTime = 0;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) {}

  startGame() {
    this.gameStarted = true;
    this.signalShown = false;
    this.waitingForSignal = true;
    this.gameEnded = false;
    this.message = 'Várj a zöld jelzésre!';

    this.randomTime = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;

    this.timer = setTimeout(() => {
      this.signalShown = true;
      this.waitingForSignal = false;
      this.startTime = Date.now();
    }, this.randomTime);
  }

  handleClick() {
    if (this.gameStarted && this.waitingForSignal && !this.signalShown) {
      this.message = 'Túl korai kattintás! Újrakezdés...';
      this.waitingForSignal = false;
      this.gameStarted = false;
      clearTimeout(this.timer);

      setTimeout(() => {
        this.startGame();
      }, 2000);
      return;
    }

    if (this.gameEnded) {
      this.resetGame();
      return;
    }

    if (!this.gameStarted && !this.gameEnded) {
      this.startGame();
      return;
    }

    if (this.signalShown) {
      this.endTime = Date.now();
      this.calculateResult();
    }
  }

  calculateResult() {
    const reactionTime = this.endTime - this.startTime;
    this.result = `Reakcióidő: ${reactionTime} ms`;
    this.signalShown = false;
    this.gameEnded = true;

    this.firebaseService.saveReactionTime(reactionTime);
  }

  resetGame() {
    this.gameStarted = false;
    this.waitingForSignal = false;
    this.signalShown = false;
    this.gameEnded = false;
    this.result = '';
    this.message = 'Készülj fel a játékra!';
  }
}
