import { Component, input } from '@angular/core';

/** Title + subtitle row with a slot for actions on the right. */
@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
      margin: 0 0 24px;
    }
    h1 { font: var(--mat-sys-headline-medium); letter-spacing: -0.01em; margin: 0; }
    .subtitle { margin: 4px 0 0; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); }
    .actions { display: flex; gap: 8px; align-items: center; }
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
