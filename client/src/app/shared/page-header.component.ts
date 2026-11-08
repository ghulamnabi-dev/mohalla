import { Component, input } from '@angular/core';

/** Title, optional context line, and a slot for primary actions. */
@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="titles">
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin: 0 0 20px; }
    h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.015em; line-height: 1.2; }
    p { margin: 3px 0 0; color: var(--ink-3); font-size: 13px; }
    .actions { display: flex; gap: 8px; align-items: center; }
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
