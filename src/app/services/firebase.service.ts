import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, orderBy, where, limit, startAfter, addDoc, DocumentSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { Timestamp } from '@angular/fire/firestore';
import { doc,docData, updateDoc, increment } from '@angular/fire/firestore';
import { UserData } from '../models/user-data.model';
import { Observable } from 'rxjs/internal/Observable';
import { combineLatest, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  async saveReactionTime(reactionTime: number) {
    const reactionCollection = collection(this.firestore, 'reactionTimes');
    const user = this.auth.currentUser;
  
    const newReaction = {
      email: user?.email || 'anonymous',
      userId: user?.uid || 'anonymous',
      reactionTime,
      timestamp: Timestamp.now()
    };
  
    return addDoc(reactionCollection, newReaction);
  }

  async setSessionStartTime(userId: string) {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { sessionStart: Timestamp.now() });
  }

  getLeaderboard() {
    const reactionCollection = collection(this.firestore, 'reactionTimes').withConverter<LeaderboardEntry>({
      toFirestore: (entry: LeaderboardEntry) => entry,
      fromFirestore: (snapshot) => snapshot.data() as LeaderboardEntry
    });
  
    const reactionQuery = query(reactionCollection, orderBy('reactionTime', 'asc'));
    return collectionData(reactionQuery, { idField: 'id' });
  }

  async incrementGamesPlayed(): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return;
  
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, {
      gamesPlayed: increment(1)
    });
  }

  getAuthUser() {
  return this.auth.currentUser;
}
  

  private getReadableTimestamp(date: Date): string {
    const year = date.getFullYear();
    const monthNames = [
      'január', 'február', 'március', 'április', 'május', 'június',
      'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const hours = this.padZero(date.getHours());
    const minutes = this.padZero(date.getMinutes());
    const seconds = this.padZero(date.getSeconds());

    return `${year}. ${month} ${day}. ${hours}:${minutes}:${seconds}`;
  }

  private padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  getUserData(userId: string) {
    const userRef = doc(this.firestore, 'users', userId);
    return docData(userRef);
  }

  async updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, {
      points: increment(pointsToAdd)
    });
    console.log(`Pont frissítve: +${pointsToAdd}`);
  }
  getUserLeaderboard() {
    const usersCollection = collection(this.firestore, 'users').withConverter<UserData>({
      toFirestore: (user: UserData) => user,
      fromFirestore: (snapshot) => snapshot.data() as UserData
    });
  
    const usersQuery = query(usersCollection, orderBy('points', 'desc'));
    return collectionData(usersQuery, { idField: 'id' });
  }

//4 osszetett lekerdezes
getFastestReactions(limitCount: number): Observable<{ email: string, reactionTime: number, timestamp: Date }[]> {
  const reactionCollection = collection(this.firestore, 'reactionTimes');
  const queryRef = query(reactionCollection, orderBy('reactionTime', 'asc'), limit(limitCount));

  return collectionData(queryRef, { idField: 'id' }).pipe(
    map(entries => entries.map(entry => ({
      email: entry['email'],
      reactionTime: entry['reactionTime'],
      timestamp: (entry['timestamp'] instanceof Timestamp) ? entry['timestamp'].toDate() : new Date(entry['timestamp'])
    })))
  );
}
getLatestTips(limitCount: number): Observable<{ email: string, reactionTime: number, timestamp: Date }[]> {
  const reactionCollection = collection(this.firestore, 'reactionTimes');

  return collectionData(reactionCollection, { idField: 'id' }).pipe(
    map(entries => entries.map(entry => ({
      email: entry['email'] || 'Nincs email',
      reactionTime: entry['reactionTime'] || 0,
      timestamp: typeof entry['timestamp'] === 'string'
        ? new Date(Date.parse(entry['timestamp']))
        : entry['timestamp'] instanceof Timestamp
        ? entry['timestamp'].toDate()
        : new Date()
    }))),
    map(entries => entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limitCount))
  );
}

getTopPlayers(limitCount: number): Observable<{ email: string, points: number, timestamp: Date }[]> {
  const usersCollection = collection(this.firestore, 'users');
  const queryRef = query(usersCollection, orderBy('points', 'desc'), limit(limitCount));

  return collectionData(queryRef, { idField: 'id' }).pipe(
    map(entries => entries.map(entry => ({
      email: entry['email'],
      points: entry['points'],
      timestamp: (entry['timestamp'] instanceof Timestamp) ? entry['timestamp'].toDate() : new Date(entry['timestamp'])
    })))
  );
}

getTopAchievementPlayers(limitCount: number): Observable<{ email: string, unlockedAchievements: number }[]> {
  const usersCollection = collection(this.firestore, 'users');

  return collectionData(usersCollection, { idField: 'id' }).pipe(
    switchMap(users =>
      combineLatest(users.map(user => {
        const achievementsCollection = collection(this.firestore, `users/${user.id}/achievements`);
        return collectionData(achievementsCollection).pipe(
          map(achievements => ({
            email: user['email'] || 'Nincs email',
            unlockedAchievements: achievements.filter((ach: any) => ach.unlocked === true).length
          }))
        );
      }))
    ),
    map(users => users.sort((a, b) => b.unlockedAchievements - a.unlockedAchievements).slice(0, limitCount))
  );
}
}