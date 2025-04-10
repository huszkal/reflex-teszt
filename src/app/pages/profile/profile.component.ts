import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { AchievementService } from '../../services/achievement.service';
import { UserData } from '../../models/user-data.model';
import { Achievement } from '../../models/achievement.model';
import { Observable } from 'rxjs';
import { NgIf, NgClass, NgForOf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [NgIf, NgForOf, NgClass, AsyncPipe]
})
export class ProfileComponent implements OnInit {
  userData!: UserData | null;
  achievements$!: Observable<Achievement[]>;
  completedAchievements = 0;
  totalAchievements = 0;
  progressPercentage = 0;
  achievements: Achievement[] = []; // Lokális tárolás a completionist progress-hez

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private achievementService: AchievementService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUser?.uid;

    if (userId) {
      this.firebaseService.getUserData(userId).subscribe(data => {
        this.userData = data as UserData;
        this.updateAchievementProgress();
      });

      this.achievements$ = this.achievementService.achievements$;

      this.achievements$.subscribe(achievements => {
        this.achievements = achievements; // Lokális tárolás
        this.totalAchievements = achievements.length;

        achievements.forEach(achievement => {
          achievement.progress = this.calculateAchievementProgress(achievement.id);
        });

        this.updateOverallProgress(achievements);
      });
    }
  }

  calculateAchievementProgress(achievementId: string): number {
    if (!this.userData) return 0;
  
    const userPoints = this.userData.points || 0;
    const userGamesPlayed = this.userData.gamesPlayed || 0;
    const userLevel = this.calculateLevel(userPoints);
    const totalAchievements = this.achievements.length;
    const completedAchievements = this.achievements.filter(a => a.unlocked).length;
  
    switch (achievementId) {
      case 'thousand-points':
        return Math.min(100, (userPoints / 1000) * 100);
  
      case 'ten-thousand-points':
        return Math.min(100, (userPoints / 10000) * 100);
  
      case 'level-5':
        return Math.min(100, (userLevel / 5) * 100);
  
      case 'level-10':
        return Math.min(100, (userLevel / 10) * 100);
  
      case 'legendary':
        return Math.min(100, (userLevel / 50) * 100);
  
      case 'ten-games':
        return Math.min(100, (userGamesPlayed / 10) * 100);
  
      case 'hundred-games':
        return Math.min(100, (userGamesPlayed / 100) * 100);
  
      case 'completionist':
        if (totalAchievements <= 1) return 0;
        const completionProgress = (completedAchievements / (totalAchievements - 1)) * 100;
        return Math.min(100, completionProgress);
  
      case 'first-game':
        return this.getUnlockedStatus(achievementId) ? 100 : Math.min(100, (userGamesPlayed > 0 ? 100 : 0));
  
      case 'fast-reactor':
      case 'super-reactor':
      case 'early-click':
      case 'perfect-score':
      case 'night-player':
      case 'morning-player':
      case 'rapid-fire':
      case 'slow-starter':
      case 'dedicated-player':
      case 'marathon':
        return this.getUnlockedStatus(achievementId) ? 100 : 0;
  
      default:
        return this.getUnlockedStatus(achievementId) ? 100 : 0;
    }
  }

  updateAchievementProgress(): void {
    this.achievements$.subscribe(achievements => {
      this.achievements = achievements;
      achievements.forEach(achievement => {
        achievement.progress = this.calculateAchievementProgress(achievement.id);
      });
      this.updateOverallProgress(achievements);
    });
  }

  updateOverallProgress(achievements: Achievement[]): void {
    this.completedAchievements = achievements.filter(a => a.unlocked).length;
    this.totalAchievements = achievements.length;
    this.progressPercentage = this.totalAchievements > 0
      ? Math.floor((this.completedAchievements / this.totalAchievements) * 100)
      : 0;
  }

  getUnlockedStatus(achievementId: string): boolean {
    const achievement = this.achievements.find(a => a.id === achievementId);
    return achievement?.unlocked ?? false;
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
}
