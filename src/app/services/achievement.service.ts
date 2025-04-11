import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Achievement } from '../models/achievement.model';
import { doc, Firestore, getDoc, setDoc, updateDoc, arrayUnion, Timestamp, collection, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { GameService } from './game.service';

@Injectable({ providedIn: 'root' })
export class AchievementService {
    private achievementsSubject = new BehaviorSubject<Achievement[]>([]);
    achievements$ = this.achievementsSubject.asObservable();

  private userId: string | null = null;
  achievementsUpdated: any;
  

  constructor(
    private firestore: Firestore, 
    private auth: Auth,
    private notificationService: NotificationService
) {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userId = user.uid;
        this.loadAchievements();
      }
    });
  }

  private updateAchievementInFirestore(achievementId: string, data: any) {
    const achievementRef = doc(this.firestore, `users/${this.userId}/achievements/${achievementId}`);
    return setDoc(achievementRef, data, { merge: true });
  }

  private loadAchievements() {
    if (!this.userId) return;
  
    const userRef = collection(this.firestore, `users/${this.userId}/achievements`);
    getDocs(userRef).then(querySnapshot => {
      const progressMap: { [id: string]: number } = {};
      const unlockedMap: { [id: string]: boolean } = {};
  
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        progressMap[docSnap.id] = data['progress'] || 0;
        unlockedMap[docSnap.id] = data['unlocked'] || false;
      });
  
      const allAchievements = this.getAllAchievements();
  
      const updated = allAchievements.map(ach => ({
        ...ach,
        unlocked: unlockedMap[ach.id] || progressMap[ach.id] >= 100,
        progress: progressMap[ach.id] || 0
      }));
  
      this.achievementsSubject.next(updated);
  
      // Completionist check
      const allUnlocked = updated.every(ach => ach.unlocked);
      if (allUnlocked) {
        this.unlockAchievement('completionist');
      }
    });
  }

  checkCompletionistAchievement() {
    const allAchievements = this.achievementsSubject.getValue();
    const alreadyUnlocked = allAchievements.find(a => a.id === 'completionist')?.unlocked;
  
    if (alreadyUnlocked) return;
  
    const allUnlocked = allAchievements
      .filter(a => a.id !== 'completionist')
      .every(a => a.unlocked);
  
    if (allUnlocked) {
      this.unlockAchievement('completionist');
    }
  }  

  private getAllAchievements(): Achievement[] {
    return [
        { id: 'first-game', title: 'Első játék', description: 'Teljesítsd az első játékot.', icon: '/images/achievements/first-game.png', unlocked: false },
        { id: 'fast-reactor', title: 'Gyors reakció', description: 'Reagálj 300 ms alatt.', icon: '/images/achievements/fast-reactor.png', unlocked: false },
        { id: 'super-reactor', title: 'Villámreakció', description: 'Reagálj 200 ms alatt.', icon: '/images/achievements/super-reactor.png', unlocked: false },
        { id: 'thousand-points', title: 'Ezer pont', description: 'Gyűjts össze 1000 pontot.', icon: '/images/achievements/100-points.png', unlocked: false },
        { id: 'ten-thousand-points', title: 'Tizezer pont', description: 'Érj el 10000 pontot.', icon: '/images/achievements/1000-points.png', unlocked: false },
        { id: 'level-5', title: '5. szint', description: 'Érj el legalább 5. szintet.', icon: '/images/achievements/level-5.png', unlocked: false },
        { id: 'level-10', title: '10. szint', description: 'Érj el legalább 10. szintet.', icon: '/images/achievements/level-10.png', unlocked: false },
        { id: 'early-click', title: 'Korai kattintás', description: 'Kattints túl korán egy játékban.', icon: '/images/achievements/early-click.png', unlocked: false },
        { id: 'ten-games', title: '10 játék', description: 'Játssz le 10 játékot.', icon: '/images/achievements/ten-games.png', unlocked: false },
        { id: 'hundred-games', title: '100 játék', description: 'Játssz le 100 játékot.', icon: '/images/achievements/hundred-games.png', unlocked: false },
        { id: 'perfect-score', title: 'Tökéletes pontszám', description: 'Szerezz maximális pontszámot egy játékban.', icon: '/images/achievements/perfect-score.png', unlocked: false },
        { id: 'night-player', title: 'Éjszakai játékos', description: 'Játssz éjfél után.', icon: '/images/achievements/night-player.png', unlocked: false },
        { id: 'morning-player', title: 'Reggeli játékos', description: 'Játssz reggel 6 előtt.', icon: '/images/achievements/morning-player.png', unlocked: false },
        { id: 'rapid-fire', title: 'Gyors sorozat', description: '3 gyors egymást követő reakció.', icon: '/images/achievements/rapid-fire.png', unlocked: false },
        { id: 'slow-starter', title: 'Lassú indítás', description: 'Reakcióidő 900 ms fölött.', icon: '/images/achievements/slow-starter.png', unlocked: false },
        { id: 'legendary', title: 'Legendás játékos', description: 'Érj el 50. szintet.', icon: '/images/achievements/legendary.png', unlocked: false },
        { id: 'completionist', title: 'Gyűjtő', description: 'Szerezd meg az összes achievementet!', icon: '/images/achievements/completionist.png', unlocked: false }    
    ];
  }

  async updateAchievementProgress(achievementId: string, progress: number) {
    if (!this.userId) return;
  
    const currentAchievements = this.achievementsSubject.getValue();
    const achievement = currentAchievements.find(a => a.id === achievementId);
  
    if (!achievement) return;
  
    // 🚫 Ha már unlocked, semmit ne csináljunk!
    if (achievement.unlocked) {
      return;
    }
  
    // ✅ Lokális update
    const updatedAchievements = currentAchievements.map(ach =>
      ach.id === achievementId ? { ...ach, progress } : ach
    );
  
    this.achievementsSubject.next(updatedAchievements);
  
    // 🔥 Firestore update, csak progress mentés, nem unlockDate!
    const achievementRef = doc(this.firestore, `users/${this.userId}/achievements/${achievementId}`);
    await setDoc(achievementRef, { progress }, { merge: true });
  
    // 🎯 Ha progress elérte a 100%-ot, unlockoljuk
    if (progress >= 100) {
      this.unlockAchievement(achievementId);
    }
  }

  async unlockAchievement(achievementId: string) {
    const achievement = this.achievementsSubject.value.find(a => a.id === achievementId);
    console.log('🏆 Achievement unlock metódus meghívva:', achievementId);
  
    if (!achievement || achievement.unlocked) {
      return;
    }
  
    achievement.unlocked = true;
    this.achievementsSubject.next(this.achievementsSubject.value);
  
    const userId = this.auth.currentUser?.uid;
    if (userId) {
      const achievementRef = doc(this.firestore, `users/${userId}/achievements/${achievementId}`);
      await setDoc(achievementRef, {
        progress: 100,
        unlocked: true,
        unlockDate: Timestamp.now()
      }, { merge: true });
    }
  
    const audio = new Audio(achievement.sound || '/sounds/achievement.mp3');
    audio.play();
  
    this.notificationService.showNotification(
      `Achievement feloldva: ${achievement.title}`,
      achievement.icon
    );
  
    this.triggerAnimation();

    this.checkCompletionistAchievement();
  }
  
  

  private triggerAnimation() {
    const body = document.body;
  
    body.classList.add('achievement-unlocked');
  
    setTimeout(() => {
      body.classList.remove('achievement-unlocked');
    }, 1500);
  }
  
}
