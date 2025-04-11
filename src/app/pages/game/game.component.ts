import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { AchievementService } from '../../services/achievement.service';
import { NotificationService } from '../../services/notification.service';
import { GameService } from '../../services/game.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [NgIf, NgClass]
})
export class GameComponent implements OnInit, OnDestroy {
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
  pointsEarned = 0;
  displayedPoints = 0;
  progressPercent = 0;
  userPoints = 0;
  animatedTotalPoints = 0;
  showLevelUp = false;
  newLevel = 0;
  currentLevel = 0;
  gamesPlayed = 0;
  earlyClickOccurred = false;
  consecutiveFastReactions = 0;
  totalPlayTime = 0;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private achievementService: AchievementService,
    private notificationService: NotificationService,
    private gameService: GameService
  ) {}

  get calculateTotalPointsForLevel() {
    return this.gameService.calculateTotalPointsForLevel.bind(this.gameService);
  }

  ngOnInit(): void {
    const userId = this.authService.currentUser?.uid;
    if (userId) {
      this.firebaseService.getUserData(userId).subscribe(userData => {
        if (userData?.['points'] != null) {
          this.userPoints = userData['points'];
          this.currentLevel = this.gameService.calculateLevel(this.userPoints);
          this.updateProgressBar();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.gameService.stopPlayTimeCounter();
  }

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
      this.earlyClickOccurred = true;
      this.message = 'Túl korai kattintás! Újrakezdés...';
      this.waitingForSignal = false;
      this.gameStarted = false;
      clearTimeout(this.timer);
      setTimeout(() => this.startGame(), 2000);
      return;
    }

    if (this.gameEnded) {
      this.resetGame();
      return;
    }

    if (!this.gameStarted) {
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
    this.pointsEarned = this.gameService.calculateScore(reactionTime);

    const userId = this.authService.currentUser?.uid;
    if (userId) {
      this.firebaseService.updateUserPoints(userId, this.pointsEarned);
    }

    if (reactionTime < 300) this.consecutiveFastReactions++;
    else this.consecutiveFastReactions = 0;

    this.animatePoints();
    this.gamesPlayed++;
    this.totalPlayTime += Date.now() - this.gameService['sessionStartTime'];

    this.gameService.checkAchievements(
      reactionTime,
      this.userPoints,
      this.currentLevel,
      this.pointsEarned,
      this.gamesPlayed,
      this.earlyClickOccurred,
      this.consecutiveFastReactions
    );
  }

  animatePoints() {
    this.gameService.animatePoints(
      this.userPoints,
      this.pointsEarned,
      '/sounds/points.mp3',
      (displayedPoints, totalPoints, currentLevel, progressPercent) => {
        this.displayedPoints = displayedPoints;
        this.animatedTotalPoints = totalPoints;
        if (currentLevel > this.currentLevel) {
          this.currentLevel = currentLevel;
          this.newLevel = currentLevel;
          this.showLevelUp = true;
          setTimeout(() => (this.showLevelUp = false), 2000);
        }
        this.progressPercent = progressPercent;
      },
      () => {
        // Completion callback
      }
    );
  }

  updateProgressBar() {
    this.progressPercent = this.gameService.updateProgressBar(
      this.userPoints,
      this.pointsEarned,
      this.currentLevel,
      (newLevel) => {
        this.currentLevel = newLevel;
        this.newLevel = newLevel;
        this.showLevelUp = true;
        setTimeout(() => (this.showLevelUp = false), 2000);
      }
    );
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