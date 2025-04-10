import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { AchievementService } from './achievement.service';

@Injectable({ providedIn: 'root' })
export class GameService {
  private totalPlayTime = 0;
  private sessionStartTime = Date.now();
  private playTimeInterval: any;
  private consecutiveFastReactions = 0;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private achievementService: AchievementService
  ) {}

  startPlayTimeCounter() {
    this.sessionStartTime = Date.now();
    this.playTimeInterval = setInterval(() => {
      this.totalPlayTime += 1000;
      const progress = Math.min(100, (this.totalPlayTime / (60 * 60 * 1000)) * 100);
      this.achievementService.updateAchievementProgress('marathon', progress);
    }, 1000);
  }

  stopPlayTimeCounter() {
    clearInterval(this.playTimeInterval);
  }

  calculateLevel(points: number): number {
    let level = 1;
    let pointsNeeded = 1000;
    while (points >= pointsNeeded) {
      points -= pointsNeeded;
      level++;
      pointsNeeded = level * 1000;
    }
    return level;
  }

  calculateScore(reactionTime: number): number {
    const baseScore = Math.max(1000 - reactionTime, 0);
    const bonus = reactionTime < 200 ? 200 : 0;
    return baseScore + bonus;
  }

  calculateTotalPointsForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += i * 1000;
    }
    return total;
  }  

  updateProgressBar(userPoints: number, pointsEarned: number, currentLevel: number, onLevelUp: (newLevel: number) => void): number {
    const totalPoints = userPoints + pointsEarned;
    const pointsAtCurrentLevel = this.calculateTotalPointsForLevel(currentLevel);
    const pointsAtNextLevel = this.calculateTotalPointsForLevel(currentLevel + 1);
    const pointsNeededForCurrentLevel = pointsAtNextLevel - pointsAtCurrentLevel;
    const pointsEarnedSinceCurrentLevel = totalPoints - pointsAtCurrentLevel;

    const progressPercent = Math.min(
      100,
      (pointsEarnedSinceCurrentLevel / pointsNeededForCurrentLevel) * 100
    );

    const calculatedLevel = this.calculateLevel(totalPoints);
    if (calculatedLevel > currentLevel) {
      onLevelUp(calculatedLevel);
    }

    return progressPercent;
  }

  animatePoints(
    userPoints: number,
    pointsEarned: number,
    audioUrl: string,
    onProgress: (displayedPoints: number, totalPoints: number, currentLevel: number, progressPercent: number) => void,
    onComplete: () => void
  ) {
    let displayedPoints = 0;
    let animatedTotalPoints = userPoints;
    const increment = Math.ceil(pointsEarned / 20);
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = 0.1;
    audio.play();

    const totalTargetPoints = userPoints + pointsEarned;

    const interval = setInterval(() => {
      displayedPoints += increment;
      if (displayedPoints > pointsEarned) displayedPoints = pointsEarned;

      if (animatedTotalPoints < totalTargetPoints) {
        animatedTotalPoints += increment;
        if (animatedTotalPoints > totalTargetPoints) {
          animatedTotalPoints = totalTargetPoints;
        }
      }

      const currentTotalPoints = userPoints + displayedPoints;
      const currentLevel = this.calculateLevel(currentTotalPoints);
      const pointsAtCurrentLevel = this.calculateTotalPointsForLevel(currentLevel);
      const pointsAtNextLevel = this.calculateTotalPointsForLevel(currentLevel + 1);
      const pointsNeededForCurrentLevel = pointsAtNextLevel - pointsAtCurrentLevel;
      const pointsEarnedSinceCurrentLevel = currentTotalPoints - pointsAtCurrentLevel;

      const progressPercent = Math.min(
        100,
        (pointsEarnedSinceCurrentLevel / pointsNeededForCurrentLevel) * 100
      );

      onProgress(displayedPoints, currentTotalPoints, currentLevel, progressPercent);

      if (displayedPoints >= pointsEarned) {
        clearInterval(interval);
        audio.pause();
        audio.currentTime = 0;
        onComplete();
      }
    }, 50);
  }

  checkAchievements(
    reactionTime: number,
    userPoints: number,
    currentLevel: number,
    pointsEarned: number,
    gamesPlayed: number,
    earlyClickOccurred: boolean,
    consecutiveFastReactions: number
  ) {
    // Pont alapú
    this.achievementService.updateAchievementProgress('thousand-points', Math.min(100, (userPoints / 1000) * 100));
    this.achievementService.updateAchievementProgress('ten-thousand-points', Math.min(100, (userPoints / 10000) * 100));

    // Szint alapú
    this.achievementService.updateAchievementProgress('level-5', Math.min(100, (currentLevel / 5) * 100));
    this.achievementService.updateAchievementProgress('level-10', Math.min(100, (currentLevel / 10) * 100));
    this.achievementService.updateAchievementProgress('legendary', Math.min(100, (currentLevel / 50) * 100));

    // Játék alapú
    this.firebaseService.incrementGamesPlayed().then(() => {
      this.firebaseService.getUserData(this.authService.currentUser?.uid!).subscribe(userData => {
        const gamesPlayedNow = userData?.['gamesPlayed'] ?? 0;
        this.achievementService.updateAchievementProgress('ten-games', Math.min(100, (gamesPlayedNow / 10) * 100));
        this.achievementService.updateAchievementProgress('hundred-games', Math.min(100, (gamesPlayedNow / 100) * 100));
      });
    });

    // Reakció alapú
    if (reactionTime < 300) this.achievementService.unlockAchievement('fast-reactor');
    if (reactionTime < 200) this.achievementService.unlockAchievement('super-reactor');
    if (reactionTime > 900) this.achievementService.unlockAchievement('slow-starter');

    // Első játék
    if (gamesPlayed === 1) this.achievementService.unlockAchievement('first-game');

    // Korai kattintás
    if (earlyClickOccurred) this.achievementService.unlockAchievement('early-click');

    // Tökéletes pontszám
    if (pointsEarned >= 1000) this.achievementService.unlockAchievement('perfect-score');

    // Éjszakai játékos
    const now = new Date();
    if (now.getHours() >= 0 && now.getHours() < 6) this.achievementService.unlockAchievement('night-player');

    // Reggeli játékos
    if (now.getHours() >= 4 && now.getHours() < 7) this.achievementService.unlockAchievement('morning-player');

    // Rapid fire
    if (consecutiveFastReactions >= 3) this.achievementService.unlockAchievement('rapid-fire');

    // Maraton
    if (this.totalPlayTime >= 60 * 60 * 1000) this.achievementService.unlockAchievement('marathon');

    // Completionist
    this.achievementService.checkCompletionistAchievement();
  }
}