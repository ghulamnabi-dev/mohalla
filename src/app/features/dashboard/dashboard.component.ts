import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { CategoriesService } from '../../core/api/categories.service';
import { ExpensesService } from '../../core/api/expenses.service';
import { FundsService } from '../../core/api/funds.service';
import { ResidentsService } from '../../core/api/residents.service';
import { SummariesService } from '../../core/api/summaries.service';
import { Expense, ExpenseCategory, Fund, Resident, Summary, monthName } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { BarChartComponent, BarSeries } from '../../shared/bar-chart.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MonthNamePipe } from '../../shared/month-name.pipe';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PkrPipe } from '../../shared/pkr.pipe';
import { StatCardComponent } from '../../shared/stat-card.component';

interface Activity {
  id: string;
  day: number;
  kind: 'payment' | 'expense';
  title: string;
  detail: string;
  amount: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressBarModule, MatTableModule, PageHeaderComponent, StatCardComponent, BarChartComponent, EmptyStateComponent, PkrPipe, MonthNamePipe],
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

  // This month -------------------------------------------------------------
  readonly collected = computed(() => this.funds().reduce((s, f) => s + f.paidAmount, 0));
  /** Shortfall on this month's recorded payments only (the API's `outstanding` is a running balance per resident). */
  readonly shortfall = computed(() => this.funds().reduce((s, f) => s + Math.max(f.amount - f.paidAmount, 0), 0));
  readonly spent = computed(() => this.expenses().reduce((s, e) => s + e.amount, 0));
  readonly current = computed(() => this.summaries().find((s) => s.month === this.month && s.year === this.year) ?? null);
  readonly paidIds = computed(() => new Set(this.funds().map((f) => f.residentId)));
  readonly paidCount = computed(() => this.paidIds().size);
  readonly unpaid = computed(() => this.residents().filter((r) => !this.paidIds().has(r.id)));
  readonly collectionPct = computed(() => (this.residents().length ? Math.round((this.paidCount() / this.residents().length) * 100) : 0));
  readonly expectedDue = computed(() => {
    const typical = this.funds()[0]?.amount ?? 0;
    return typical * this.residents().length;
  });

  // Versus last month ------------------------------------------------------
  readonly previous = computed(() => {
    const m = this.month === 1 ? 12 : this.month - 1;
    const y = this.month === 1 ? this.year - 1 : this.year;
    return this.summaries().find((s) => s.month === m && s.year === y) ?? null;
  });
  readonly prevLabel = computed(() => (this.previous() ? `vs ${monthName(this.previous()!.month, true)}` : undefined));
  readonly collectedDelta = computed(() => pct(this.collected(), this.previous()?.totalFund));
  readonly spentDelta = computed(() => pct(this.spent(), this.previous()?.expense));
  readonly balanceDelta = computed(() => pct(this.current()?.closingBalance, this.previous()?.closingBalance));

  // Chart ------------------------------------------------------------------
  readonly last12 = computed(() => [...this.summaries()].sort((a, b) => a.year - b.year || a.month - b.month).slice(-12));
  readonly chartLabels = computed(() => this.last12().map((s) => `${monthName(s.month, true)} ${String(s.year).slice(2)}`));
  readonly chartSeries = computed<BarSeries[]>(() => [
    { name: 'Collected', color: 'var(--chart-1)', values: this.last12().map((s) => s.totalFund) },
    { name: 'Spent', color: 'var(--chart-2)', values: this.last12().map((s) => s.expense) },
  ]);

  // Activity ---------------------------------------------------------------
  readonly activityColumns = ['day', 'what', 'amount'];
  readonly activity = computed<Activity[]>(() => {
    const byResident = new Map(this.residents().map((r) => [r.id, r]));
    const byCat = new Map(this.categories().map((c) => [c.id, c.name]));
    const payments: Activity[] = this.funds().map((f) => ({
      id: `p${f.id}`, day: f.datePaid, kind: 'payment',
      title: byResident.get(f.residentId)?.ownerName ?? 'Unknown resident',
      detail: f.paidAmount < f.amount ? `Partial, Rs ${(f.amount - f.paidAmount).toLocaleString('en-PK')} short` : `House ${byResident.get(f.residentId)?.houseNumber ?? '—'}`,
      amount: f.paidAmount,
    }));
    const spend: Activity[] = this.expenses().map((e) => ({
      id: `e${e.id}`, day: e.expenseDate, kind: 'expense', title: e.description, detail: byCat.get(e.categoryId) ?? 'Uncategorised', amount: -e.amount,
    }));
    return [...payments, ...spend].sort((a, b) => b.day - a.day).slice(0, 8);
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
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

function pct(current: number | undefined | null, previous: number | undefined | null): number | null {
  if (current == null || !previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}
