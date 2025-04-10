import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LeaderboardEntry } from '../../../models/leaderboard-entry.model';

@Component({
  selector: 'app-leaderboard-entry',
  standalone: true,
  template: `
    <tr (click)="selectEntry()">
      <td>{{ index + 1 }}</td>
      <td>{{ entry.email }}</td>
      <td>{{ entry.reactionTime }} ms</td>
      <td>{{ entry.timestamp }}</td>
    </tr>
  `,
  styles: [`
    tr {
      cursor: pointer;
      transition: background-color 0.3s;
    }
    tr:hover {
      background-color: #f0f4ff;
    }
  `]
})
export class LeaderboardEntryComponent {
  @Input() entry!: LeaderboardEntry;
  @Input() index!: number;

  @Output() entrySelected = new EventEmitter<LeaderboardEntry>();

  selectEntry() {
    this.entrySelected.emit(this.entry);
  }
}
