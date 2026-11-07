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
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FundsService } from '../../core/api/funds.service';
import { ResidentsService } from '../../core/api/residents.service';
import { Fund, FundRow, MONTHS, Resident } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MonthNamePipe } from '../../shared/month-name.pipe';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PkrPipe } from '../../shared/pkr.pipe';
import { FundDialogComponent } from './fund-dialog.component';

@Component({
  selector: 'app-funds',
  imports: [
    MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatProgressBarModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent, PkrPipe, MonthNamePipe,
  ],
  templateUrl: './funds.component.html',
})
export class FundsComponent {
  private readonly fundsApi = inject(FundsService);
  private readonly residentsApi = inject(ResidentsService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly months = MONTHS;
  readonly columns = ['residentName', 'period', 'paidTo', 'amount', 'paidAmount', 'outstanding', 'actions'];
  readonly data = new MatTableDataSource<FundRow>([]);
  readonly loading = signal(true);
  readonly residents = signal<Resident[]>([]);
  readonly all = signal<FundRow[]>([]);
  readonly year = signal<number | 'all'>(new Date().getFullYear());
  readonly month = signal<number | 'all'>('all');
  readonly years = computed(() => [...new Set(this.all().map((f) => f.year))].sort((a, b) => b - a));

  readonly visible = computed(() =>
    this.all().filter((f) => (this.year() === 'all' || f.year === this.year()) && (this.month() === 'all' || f.month === this.month())),
  );
  readonly totalPaid = computed(() => this.visible().reduce((s, f) => s + f.paidAmount, 0));
  /** Shortfall on the visible payments (amount due minus paid); the API's `outstanding` is a per-resident running balance. */
  readonly totalDue = computed(() => this.visible().reduce((s, f) => s + Math.max(f.amount - f.paidAmount, 0), 0));

  @ViewChild(MatSort) set sort(s: MatSort) { this.data.sort = s; }
  @ViewChild(MatPaginator) set paginator(p: MatPaginator) { this.data.paginator = p; }

  constructor() {
    this.data.filterPredicate = (r, q) => [r.residentName, r.houseNumber, r.paidTo].join(' ').toLowerCase().includes(q);
    this.data.sortingDataAccessor = (r, col) => (col === 'period' ? r.year * 100 + r.month : (r as unknown as Record<string, string | number>)[col]);
    this.load();
    if (inject(ActivatedRoute).snapshot.queryParamMap.has('add')) queueMicrotask(() => this.open());
  }

  load(): void {
    this.loading.set(true);
    // One request each — the previous version fetched every resident individually per row.
    forkJoin({ funds: this.fundsApi.list(), residents: this.residentsApi.list() }).subscribe({
      next: ({ funds, residents }) => {
        const byId = new Map(residents.map((r) => [r.id, r]));
        this.residents.set(residents);
        this.all.set(
          funds.map((f) => ({ ...f, residentName: byId.get(f.residentId)?.ownerName ?? 'Unknown', houseNumber: byId.get(f.residentId)?.houseNumber ?? '' })),
        );
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

  open(fund?: Fund): void {
    this.dialog
      .open(FundDialogComponent, { data: { fund: fund ?? null, residents: this.residents() }, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved: boolean) => {
        if (saved) {
          this.notify.success(fund ? 'Payment updated.' : 'Payment recorded.');
          this.load();
        }
      });
  }

  remove(row: FundRow): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete payment?', message: `Remove ${row.residentName}'s payment for ${MONTHS[row.month - 1]} ${row.year}?`, confirmLabel: 'Delete', destructive: true },
      })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.fundsApi.delete(row.id).subscribe({
          next: () => {
            this.notify.success('Payment deleted.');
            this.load();
          },
          error: (err) => this.notify.error(err),
        });
      });
  }
}
