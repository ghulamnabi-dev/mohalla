import { Component, computed, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { catchError, forkJoin, of } from 'rxjs';
import { UsersService } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { Role, UserAccount } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

@Component({
  selector: 'app-users',
  imports: [MatTableModule, MatFormFieldModule, MatSelectModule, MatProgressBarModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './users.component.html',
  styles: `
    .role-cell { display: flex; align-items: center; gap: 12px; }
    .role-select {
      width: 132px;
      --mat-form-field-container-height: 34px;
      --mat-form-field-container-vertical-padding: 6px;
      --mat-select-trigger-text-size: 13.5px;
      --mat-form-field-container-text-size: 13.5px;
    }
    .you { margin-left: 6px; }
  `,
})
export class UsersComponent {
  private readonly api = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  readonly roles: { value: Role; label: string }[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Viewer', label: 'Viewer' },
  ];
  readonly columns = ['fullName', 'email', 'role'];
  readonly loading = signal(true);
  readonly users = signal<UserAccount[]>([]);
  readonly meId = signal<string | null>(null);
  readonly saving = signal<string | null>(null);
  readonly subtitle = computed(() => `${this.users().length} account${this.users().length === 1 ? '' : 's'}`);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ users: this.api.list(), me: this.auth.me().pipe(catchError(() => of(null))) }).subscribe({
      next: ({ users, me }) => {
        this.users.set([...users].sort((a, b) => (a.fullName || a.email).localeCompare(b.fullName || b.email)));
        this.meId.set(me?.id ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err);
      },
    });
  }

  /** The signed-in user's own row — by id from /Auth/me, falling back to the token's e-mail. */
  isMe(u: UserAccount): boolean {
    const id = this.meId();
    if (id != null) return String(u.id) === String(id);
    const email = this.auth.userEmail();
    return !!email && u.email.toLowerCase() === email.toLowerCase();
  }

  changeRole(u: UserAccount, event: MatSelectChange): void {
    const role = event.value as Role;
    if (role === u.role) return;
    this.saving.set(u.id);
    this.api.setRole(u.id, role).subscribe({
      next: () => {
        this.saving.set(null);
        this.users.update((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
        this.notify.success(`${u.fullName || u.email} is now ${role === 'Admin' ? 'an admin' : 'read-only'}.`);
      },
      error: (err) => {
        this.saving.set(null);
        event.source.value = u.role; // put the select back
        this.notify.error(err);
      },
    });
  }
}
