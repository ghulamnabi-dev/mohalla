import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { ExpensesService } from '../../core/api/expenses.service';
import { FundsService } from '../../core/api/funds.service';
import { ResidentsService } from '../../core/api/residents.service';
import { SummariesService } from '../../core/api/summaries.service';
import { CategoriesService } from '../../core/api/categories.service';
import { Expense, ExpenseCategory, Fund, Resident, Summary, monthName } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { BarChartComponent, BarSeries } from '../../shared/bar-chart.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PkrPipe } from '../../shared/pkr.pipe';
import { StatCardComponent } from '../../shared/stat-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressBarModule, PageHeaderComponent, StatCardComponent, BarChartComponent, EmptyStateComponent, PkrPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly residentsApi = inject(ResidentsService);
  private readonly fundsApi = inject(FundsService);
  private readonly expensesApi = inject(ExpensesService);
  private readonly summariesApi = inject(SummariesService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly notify = inject(NotificationService);

  readonly now = new Date();
  readonly month = this.now.getMonth() + 1;
  readonly year = this.now.getFullYear();
  readonly monthLabel = `${monthName(this.month)} ${this.year}`;

  readonly loading = signal(true);
  readonly residents = signal<Resident[]>([]);
  readonly funds = signal<Fund[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly summaries = signal<Summary[]>([]);
  readonly categories = signal<ExpenseCategory[]>([]);

  readonly collected = computed(() => this.funds().reduce((s, f) => s + f.paidAmount, 0));
  readonly outstanding = computed(() => this.funds().reduce((s, f) => s + f.outstanding, 0));
  readonly spent = computed(() => this.expenses().reduce((s, e) => s + e.amount, 0));
  readonly current = computed(() => this.summaries().find((s) => s.month === this.month && s.year === this.year) ?? null);
  readonly paidCount = computed(() => new Set(this.funds().map((f) => f.residentId)).size);

  /** Last 12 summaries, oldest first, for the chart. */
  readonly last12 = computed(() =>
    [...this.summaries()].sort((a, b) => a.year - b.year || a.month - b.month).slice(-12),
  );
  readonly chartLabels = computed(() => this.last12().map((s) => `${monthName(s.month, true)} ${String(s.year).slice(2)}`));
  readonly chartSeries = computed<BarSeries[]>(() => [
    { name: 'Collected', color: '#0b57d0', values: this.last12().map((s) => s.totalFund) },
    { name: 'Spent', color: '#b3261e', values: this.last12().map((s) => s.expense) },
  ]);

  readonly recentExpenses = computed(() =>
    [...this.expenses()]
      .sort((a, b) => b.expenseDate - a.expenseDate)
      .slice(0, 5)
      .map((e) => ({ ...e, categoryName: this.categories().find((c) => c.id === e.categoryId)?.name ?? '—' })),
  );
  readonly recentFunds = computed(() =>
    [...this.funds()]
      .sort((a, b) => b.datePaid - a.datePaid)
      .slice(0, 5)
      .map((f) => ({ ...f, residentName: this.residents().find((r) => r.id === f.residentId)?.ownerName ?? '—' })),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    // Each call falls back to an empty list so one failing endpoint doesn't blank the whole page.
    const safe = <T>(source: Observable<T[]>): Observable<T[]> => source.pipe(catchError(() => of([] as T[])));
    forkJoin({
      residents: safe(this.residentsApi.list()),
      funds: safe(this.fundsApi.byMonth(this.month)),
      expenses: safe(this.expensesApi.byMonth(this.month, this.year)),
      summaries: safe(this.summariesApi.list()),
      categories: safe(this.categoriesApi.list()),
    }).subscribe({
      next: (d) => {
        this.residents.set(d.residents);
        this.funds.set(d.funds.filter((f) => f.year === this.year));
        this.expenses.set(d.expenses);
        this.summaries.set(d.summaries);
        this.categories.set(d.categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err);
      },
    });
  }
}
