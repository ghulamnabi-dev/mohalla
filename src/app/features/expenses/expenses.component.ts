import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { CategoriesService } from '../../core/api/categories.service';
import { ExpensesService } from '../../core/api/expenses.service';
import { Expense, ExpenseCategory, ExpenseRow, MONTHS } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MonthNamePipe } from '../../shared/month-name.pipe';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PkrPipe } from '../../shared/pkr.pipe';
import { CategoriesDialogComponent } from './categories-dialog.component';
import { ExpenseDialogComponent } from './expense-dialog.component';

@Component({
  selector: 'app-expenses',
  imports: [
    MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatProgressBarModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent, PkrPipe, MonthNamePipe,
  ],
  templateUrl: './expenses.component.html',
})
export class ExpensesComponent {
  private readonly expensesApi = inject(ExpensesService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly months = MONTHS;
  readonly columns = ['description', 'categoryName', 'period', 'amount', 'actions'];
  readonly data = new MatTableDataSource<ExpenseRow>([]);
  readonly loading = signal(true);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly all = signal<ExpenseRow[]>([]);
  readonly year = signal<number | 'all'>(new Date().getFullYear());
  readonly category = signal<number | 'all'>('all');
  readonly years = computed(() => [...new Set(this.all().map((e) => e.year))].sort((a, b) => b - a));
  readonly visible = computed(() =>
    this.all().filter((e) => (this.year() === 'all' || e.year === this.year()) && (this.category() === 'all' || e.categoryId === this.category())),
  );
  readonly total = computed(() => this.visible().reduce((s, e) => s + e.amount, 0));

  @ViewChild(MatSort) set sort(s: MatSort) { this.data.sort = s; }
  @ViewChild(MatPaginator) set paginator(p: MatPaginator) { this.data.paginator = p; }

  constructor() {
    this.data.filterPredicate = (r, q) => [r.description, r.categoryName].join(' ').toLowerCase().includes(q);
    this.data.sortingDataAccessor = (r, col) => (col === 'period' ? r.year * 10000 + r.month * 100 + r.expenseDate : (r as unknown as Record<string, string | number>)[col]);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ expenses: this.expensesApi.list(), categories: this.categoriesApi.list() }).subscribe({
      next: ({ expenses, categories }) => {
        const byId = new Map(categories.map((c) => [c.id, c.name]));
        this.categories.set(categories);
        this.all.set(expenses.map((e) => ({ ...e, categoryName: byId.get(e.categoryId) ?? 'Uncategorised' })));
        this.apply();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err);
      },
    });
  }

  apply(): void {
    this.data.data = this.visible();
    this.data.paginator?.firstPage();
  }

  filter(value: string): void {
    this.data.filter = value.trim().toLowerCase();
  }

  open(expense?: Expense): void {
    this.dialog
      .open(ExpenseDialogComponent, { data: { expense: expense ?? null, categories: this.categories() }, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved: boolean) => {
        if (saved) {
          this.notify.success(expense ? 'Expense updated.' : 'Expense added.');
          this.load();
        }
      });
  }

  manageCategories(): void {
    this.dialog
      .open(CategoriesDialogComponent, { autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe(() => this.load());
  }

  remove(row: ExpenseRow): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete expense?', message: `"${row.description}" will be removed from ${MONTHS[row.month - 1]} ${row.year}.`, confirmLabel: 'Delete', destructive: true },
      })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.expensesApi.delete(row.id).subscribe({
          next: () => {
            this.notify.success('Expense deleted.');
            this.load();
          },
          error: (err) => this.notify.error(err),
        });
      });
  }
}
