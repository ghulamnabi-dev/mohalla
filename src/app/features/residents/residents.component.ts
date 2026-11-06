import { Component, ViewChild, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResidentsService } from '../../core/api/residents.service';
import { Resident } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ResidentDialogComponent } from './resident-dialog.component';

@Component({
  selector: 'app-residents',
  imports: [
    MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatProgressBarModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent,
  ],
  templateUrl: './residents.component.html',
})
export class ResidentsComponent {
  private readonly api = inject(ResidentsService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly columns = ['ownerName', 'houseNumber', 'street', 'phoneNumber', 'actions'];
  readonly data = new MatTableDataSource<Resident>([]);
  readonly loading = signal(true);
  readonly count = signal(0);

  @ViewChild(MatSort) set sort(s: MatSort) { this.data.sort = s; }
  @ViewChild(MatPaginator) set paginator(p: MatPaginator) { this.data.paginator = p; }

  constructor() {
    this.data.filterPredicate = (r, q) =>
      [r.ownerName, r.houseNumber, r.street, r.phoneNumber].join(' ').toLowerCase().includes(q);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.data.data = rows;
        this.count.set(rows.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err);
      },
    });
  }

  filter(value: string): void {
    this.data.filter = value.trim().toLowerCase();
    this.data.paginator?.firstPage();
  }

  open(resident?: Resident): void {
    this.dialog
      .open(ResidentDialogComponent, { data: resident ?? null, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved: boolean) => {
        if (saved) {
          this.notify.success(resident ? 'Resident updated.' : 'Resident added.');
          this.load();
        }
      });
  }

  remove(resident: Resident): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete resident?', message: `${resident.ownerName} (house ${resident.houseNumber}) will be removed. Their payment history stays in the ledger.`, confirmLabel: 'Delete', destructive: true },
      })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.api.delete(resident.id).subscribe({
          next: () => {
            this.notify.success('Resident deleted.');
            this.load();
          },
          error: (err) => this.notify.error(err),
        });
      });
  }
}
