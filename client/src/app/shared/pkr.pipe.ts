import { Pipe, PipeTransform } from '@angular/core';

const fmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

/** Pakistani rupees, e.g. 12500 → "Rs 12,500". */
@Pipe({ name: 'pkr' })
export class PkrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    return `Rs ${fmt.format(value)}`;
  }
}
