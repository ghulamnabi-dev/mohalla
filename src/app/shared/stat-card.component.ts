import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A KPI tile. Fixed height; the label never wraps, the figure is tabular,
 * and the optional delta is coloured by sign.
 */
@Component({
  selector: 'app-stat-card',
  imports: [RouterLink],
  template: `
    <a class="stat" [routerLink]="link()">
      <span class="label">{{ label() }}</span>
      <span class="value">{{ value() }}</span>
      <span class="foot">
        @if (delta() != null) {
          <span class="delta" [class.good]="(delta()! > 0) === (goodWhen() === 'up')" [class.bad]="(delta()! > 0) !== (goodWhen() === 'up')">{{ delta()! > 0 ? '+' : '' }}{{ delta() }}%</span>
        }
        @if (hint()) { <span class="hint">{{ hint() }}</span> }
      </span>
    </a>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .stat {
      display: grid; grid-template-rows: auto 1fr auto; height: 108px; padding: 16px 18px;
      border: 1px solid var(--line); border-radius: var(--radius-l); background: var(--surface);
      color: inherit; text-decoration: none; transition: border-color .12s;
      &:hover { border-color: var(--line-strong); text-decoration: none; }
    }
    .label { font-size: 12.5px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .value { align-self: end; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .foot { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; font-size: 12px; color: var(--ink-3); white-space: nowrap; overflow: hidden; }
    .delta { font-weight: 600; font-variant-numeric: tabular-nums; }
    .delta.good { color: var(--positive); }
    .delta.bad { color: var(--negative); }
    .hint { overflow: hidden; text-overflow: ellipsis; }
  `,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  hint = input<string>();
  delta = input<number | null>(null);
  link = input<string | unknown[]>('.');
  /** Which direction of change is desirable — spending going down is good. */
  goodWhen = input<'up' | 'down'>('up');
}
