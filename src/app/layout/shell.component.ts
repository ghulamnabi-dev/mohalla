import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly nav: NavItem[] = [
    { label: 'Dashboard', icon: 'space_dashboard', path: 'dashboard' },
    { label: 'Residents', icon: 'groups', path: 'residents' },
    { label: 'Contributions', icon: 'payments', path: 'funds' },
    { label: 'Expenses', icon: 'receipt_long', path: 'expenses' },
    { label: 'Monthly ledger', icon: 'account_balance', path: 'summary' },
  ];

  readonly isHandset = toSignal(
    inject(BreakpointObserver).observe('(max-width: 900px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );
  readonly mode = computed(() => (this.isHandset() ? 'over' : 'side'));
  readonly userName = this.auth.userName;
  readonly userEmail = this.auth.userEmail;
  readonly initials = computed(() =>
    this.userName()
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join(''),
  );

  logout(): void {
    this.auth.logout();
  }
}
