import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'readableDate',
  standalone: true
})
export class ReadableDatePipe implements PipeTransform {
  transform(value: any): string {
    let date: Date;

    if (!value) {
      return 'Nincs dátum';
    }

    if (value instanceof Timestamp) {
      date = value.toDate();
    } else if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!isNaN(parsed)) {
        date = new Date(parsed);
      } else {
        return value;
      }
    } else if (value instanceof Date) {
      date = value;
    } else {
      return 'Érvénytelen dátum';
    }

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
}
