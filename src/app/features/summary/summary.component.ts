import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SummariesService } from '../../core/api/summaries.service';
import { Summary, monthName } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { BarChartComponent, BarSeries } from '../../shared/bar-chart.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MonthNamePipe } from '../../shared/month-name.pipe';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PkrPipe } from '../../shared/pkr.pipe';

@Component({
  selector: 'app-summary',
  imports: [MatTableModule, MatSortModule, MatButtonModule, MatIconModule, MatProgressBarModule, PageHeaderComponent, EmptyStateComponent, BarChartComponent, PkrPipe, MonthNamePipe],
  templateUrl: './summary.component.html',
  styles: `
    .chart-wrap { padding: 20px; }
    td.pos { color: #2e7d32; } td.neg { color: var(--mat-sys-error); }
    :host-context(html.dark) td.pos { color: #81c784; }
    .card + .card { margin-top: 16px; }
  `,
})
export class SummaryComponent {
  private readonly api = inject(SummariesService);
  private readonly notify = inject(NotificationService);

  readonly columns = ['period', 'openningBalance', 'totalFund', 'expense', 'net', 'closingBalance'];
  readonly data = new MatTableDataSource<Summary>([]);
  readonly loading = signal(true);
  readonly rows = signal<Summary[]>([]);

  readonly sorted = computed(() => [...this.rows()].sort((a, b) => a.year - b.year || a.month - b.month));
  readonly last12 = computed(() => this.sorted().slice(-12));
  readonly labels = computed(() => this.last12().map((s) => `${monthName(s.month, true)} ${String(s.year).slice(2)}`));
  readonly series = computed<BarSeries[]>(() => [
    { name: 'Collected', color: 'var(--chart-1)', values: this.last12().map((s) => s.totalFund) },
    { name: 'Spent', color: 'var(--chart-2)', values: this.last12().map((s) => s.expense) },
    { name: 'Closing balance', color: 'var(--chart-3)', values: this.last12().map((s) => Math.max(s.closingBalance, 0)) },
  ]);

  @ViewChild(MatSort) set sort(s: MatSort) { this.data.sort = s; }

  constructor() {
    this.data.sortingDataAccessor = (r, col) => (col === 'period' ? r.year * 100 + r.month : col === 'net' ? r.totalFund - r.expense : (r as unknown as Record<string, number>)[col]);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.data.data = rows;
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err);
      },
    });
  }

  exportCsv(): void {
    const header = 'Year,Month,Opening balance,Collected,Spent,Closing balance';
    const lines = this.sorted().map((s) => [s.year, monthName(s.month), s.openningBalance, s.totalFund, s.expense, s.closingBalance].join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'monthly-ledger.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
