import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <mat-icon>{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      display: grid; justify-items: center; text-align: center; gap: 8px; padding: 56px 24px;
      color: var(--mat-sys-on-surface-variant);
      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }
      h3 { margin: 8px 0 0; font: var(--mat-sys-title-medium); color: var(--mat-sys-on-surface); }
      p { margin: 0 0 8px; max-width: 42ch; }
    }
  `,
})
export class EmptyStateComponent {
  icon = input('inbox');
  title = input.required<string>();
  message = input<string>();
}
