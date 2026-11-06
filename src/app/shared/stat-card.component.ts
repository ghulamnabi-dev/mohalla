import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/** A KPI tile for the dashboard. */
@Component({
  selector: 'app-stat-card',
  imports: [MatIconModule, RouterLink],
  template: `
    <a class="stat" [routerLink]="link()" [class]="'tone-' + tone()">
      <div class="icon"><mat-icon>{{ icon() }}</mat-icon></div>
      <div class="body">
        <span class="label">{{ label() }}</span>
        <span class="value">{{ value() }}</span>
        @if (hint()) {
          <span class="hint">{{ hint() }}</span>
        }
      </div>
      <mat-icon class="chev">chevron_right</mat-icon>
    </a>
  `,
  styles: `
    .stat {
      display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px;
      padding: 18px 16px; border-radius: 16px; min-width: 0; text-decoration: none; color: inherit;
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
      &:hover { transform: translateY(-1px); box-shadow: var(--mat-sys-level2); border-color: var(--mat-sys-outline); }
    }
    .icon {
      display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px;
      background: var(--tone-bg); color: var(--tone-fg);
    }
    .body { display: grid; gap: 2px; min-width: 0; }
    .label { font: var(--mat-sys-label-large); color: var(--mat-sys-on-surface-variant); }
    .value { font: var(--mat-sys-headline-small); font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .label { line-height: 1.2; }
    .hint { font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }
    .chev { color: var(--mat-sys-outline); }
    .tone-primary { --tone-bg: var(--mat-sys-primary-container); --tone-fg: var(--mat-sys-on-primary-container); }
    .tone-positive { --tone-bg: color-mix(in srgb, #2e7d32 18%, transparent); --tone-fg: #2e7d32; }
    .tone-negative { --tone-bg: var(--mat-sys-error-container); --tone-fg: var(--mat-sys-on-error-container); }
    .tone-neutral { --tone-bg: var(--mat-sys-secondary-container); --tone-fg: var(--mat-sys-on-secondary-container); }
    :host-context(.dark) .tone-positive { --tone-fg: #81c784; }
  `,
})
export class StatCardComponent {
  icon = input.required<string>();
  label = input.required<string>();
  value = input.required<string>();
  hint = input<string>();
  link = input<string | unknown[]>('.');
  tone = input<'primary' | 'positive' | 'negative' | 'neutral'>('primary');
}
