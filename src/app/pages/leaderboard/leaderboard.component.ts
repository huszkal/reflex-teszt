import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { LeaderboardEntry } from '../../models/leaderboard-entry.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf } from '@angular/common';
import { ReadableDatePipe } from '../../pipes/readable-date.pipe';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    AsyncPipe,
    NgIf,
    ReadableDatePipe
  ],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  leaderboard$!: Observable<LeaderboardEntry[]>;
 displayedColumns: string[] = ['position', 'award', 'email', 'reactionTime', 'timestamp'];


  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.leaderboard$ = this.firebaseService.getLeaderboard().pipe(
      map(entries => this.filterBestResults(entries))
    );
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
