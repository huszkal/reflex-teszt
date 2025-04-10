import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { LeaderboardEntry } from '../../models/leaderboard-entry.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf , NgClass, NgForOf} from '@angular/common';
import { ReadableDatePipe } from '../../pipes/readable-date.pipe';
import { Observable, combineLatest, map } from 'rxjs';
import { UserData } from '../../models/user-data.model';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    AsyncPipe,
    NgIf,
    NgClass,
    NgForOf,
    ReadableDatePipe
  ],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  leaderboard$!: Observable<LeaderboardEntry[]>
 displayedColumns: string[] = ['position', 'award', 'email', 'reactionTime', 'timestamp'];


  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    const reactionTimes$ = this.firebaseService.getLeaderboard().pipe(
      map(entries => this.filterBestResults(entries))
    );
  
    const users$ = this.firebaseService.getUserLeaderboard();
  
    this.leaderboard$ = combineLatest([reactionTimes$, users$]).pipe(
      map(([reactions, users]) => {
        return reactions.map(reaction => {
          const user = users.find(u => u.email === reaction.email);
          return {
            ...reaction,
            points: user?.points ?? 0
          };
        });
      })
    );
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

  private filterBestResults(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    const bestResultsMap = new Map<string, LeaderboardEntry>();

    entries.forEach(entry => {
      const existing = bestResultsMap.get(entry.email);
      if (!existing || entry.reactionTime < existing.reactionTime) {
        bestResultsMap.set(entry.email, entry);
      }
    });

    return Array.from(bestResultsMap.values()).sort((a, b) => a.reactionTime - b.reactionTime);
  }
}
