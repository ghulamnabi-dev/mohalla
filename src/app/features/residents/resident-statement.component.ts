import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ResidentsService } from '../../core/api/residents.service';
import { AdminOnlyDirective } from '../../core/auth/admin-only.directive';
import { Resident, ResidentStatement } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { MonthNamePipe } from '../../shared/month-name.pipe';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PkrPipe } from '../../shared/pkr.pipe';
import { StatCardComponent } from '../../shared/stat-card.component';
import { FundDialogComponent, FundDialogData } from '../funds/fund-dialog.component';
import { withRunningBalance } from './statement';

const pkr = new PkrPipe();

@Component({
  selector: 'app-resident-statement',
  imports: [
    DatePipe, MatTableModule, MatButtonModule, MatDialogModule, MatProgressBarModule,
    PageHeaderComponent, StatCardComponent, EmptyStateComponent, PkrPipe, MonthNamePipe, AdminOnlyDirective,
  ],
  templateUrl: './resident-statement.component.html',
  styleUrl: './resident-statement.component.scss',
})
export class ResidentStatementComponent {
  private readonly api = inject(ResidentsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly columns = ['period', 'paidTo', 'amount', 'paidAmount', 'status', 'runningBalance'];
  readonly printedOn = new Date();

  readonly loading = signal(true);
  readonly statement = signal<ResidentStatement | null>(null);
  private id = 0;

  readonly resident = computed(() => this.statement()?.resident ?? null);
  readonly rows = computed(() => withRunningBalance(this.statement()?.payments ?? []));
  readonly title = computed(() => this.resident()?.ownerName ?? 'Statement');
  readonly subtitle = computed(() => {
    const r = this.resident();
    return r ? `House ${r.houseNumber}, ${r.street} · ${r.phoneNumber}` : '';
  });

  readonly balance = computed(() => this.statement()?.balance ?? 0);
  readonly balanceHint = computed(() => {
    const b = this.balance();
    if (b === 0) return 'Settled';
    return b > 0 ? 'Still owed' : `${pkr.transform(-b)} in credit`;
  });
  readonly paidHint = computed(() => {
    const s = this.statement();
    return s && s.totalDue > 0 ? `${Math.round((s.totalPaid / s.totalDue) * 100)}% of the amount due` : undefined;
  });
  readonly monthsValue = computed(() => {
    const s = this.statement();
    return s ? `${s.monthsPaid} paid · ${s.monthsShort} short` : '—';
  });

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.id = Number(params.get('id'));
        this.load();
      });
  }

  load(): void {
    if (!Number.isInteger(this.id) || this.id <= 0) return this.notFound();
    this.loading.set(true);
    this.api.statement(this.id).subscribe({
      next: (s) => {
        this.statement.set(s);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) this.notFound();
        else this.notify.error(err);
      },
    });
  }

  print(): void {
    window.print();
  }

  recordPayment(): void {
    const r = this.resident();
    if (!r) return;
    const data: FundDialogData = { fund: null, residents: [r as Resident] };
    this.dialog
      .open(FundDialogComponent, { data, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved: boolean) => {
        if (saved) {
          this.notify.success('Payment recorded.');
          this.load();
        }
      });
  }

  private notFound(): void {
    this.notify.error('That resident no longer exists.');
    void this.router.navigate(['/app/residents']);
  }
}
