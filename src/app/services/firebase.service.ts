import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, orderBy, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { Timestamp } from '@angular/fire/firestore';
import { doc,docData, updateDoc, increment } from '@angular/fire/firestore';
import { UserData } from '../models/user-data.model';

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
      gamesPlayed: increment(1) // ✅ Fontos: használd a Firestore increment-et!
    });
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
  
}
