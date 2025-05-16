import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf, NgForOf } from '@angular/common';
import { ReadableDatePipe } from '../../pipes/readable-date.pipe';

@Component({
  selector: 'app-queries',
  standalone: true,
  imports: [
    ReadableDatePipe,
    MatCardModule,
    MatTableModule,
    AsyncPipe,
    NgIf,
    NgForOf
  ],
  templateUrl: './queries.component.html',
  styleUrls: ['./queries.component.scss']
})
export class QueriesComponent implements OnInit {
    fastestReactions$!: Observable<{ email: string, reactionTime: number, timestamp: Date }[]>;
    topPlayers$!: Observable<{ email: string, points: number, timestamp: Date }[]>;
    latestTips$!: Observable<{ email: string, reactionTime: number, timestamp: Date }[]>;
    topAchievementPlayers$!: Observable<{ email: string, unlockedAchievements: number }[]>;

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.fastestReactions$ = this.firebaseService.getFastestReactions(5);
    this.topPlayers$ = this.firebaseService.getTopPlayers(5);
    this.latestTips$ = this.firebaseService.getLatestTips(5);
    this.topAchievementPlayers$ = this.firebaseService.getTopAchievementPlayers(5);
  }
}