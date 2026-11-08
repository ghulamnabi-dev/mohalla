import { Pipe, PipeTransform } from '@angular/core';
import { monthName } from '../core/models';

@Pipe({ name: 'monthName' })
export class MonthNamePipe implements PipeTransform {
  transform(month: number, short = false): string {
    return monthName(month, short);
  }
}
