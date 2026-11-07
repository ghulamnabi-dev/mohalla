import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export interface BarSeries {
  name: string;
  color: string;
  values: number[];
}

/**
 * Dependency-free grouped bar chart (SVG). Enough for a 12-month comparison
 * without pulling a charting library into the bundle.
 */
@Component({
  selector: 'app-bar-chart',
  template: `
    <figure class="chart">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel()">
        @for (t of ticks(); track t.y) {
          <line [attr.x1]="padL" [attr.x2]="W - padR" [attr.y1]="t.y" [attr.y2]="t.y" class="grid" />
          <text [attr.x]="padL - 6" [attr.y]="t.y + 3" text-anchor="end" class="tick">{{ t.label }}</text>
        }
        @for (g of groups(); track g.label) {
          @for (b of g.bars; track b.name) {
            <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" [attr.fill]="b.color" rx="3">
              <title>{{ g.label }} · {{ b.name }}: {{ b.value | number: '1.0-0' }}</title>
            </rect>
          }
          <text [attr.x]="g.cx" [attr.y]="H - 6" text-anchor="middle" class="tick">{{ g.label }}</text>
        }
      </svg>
      <figcaption class="legend">
        @for (s of series(); track s.name) {
          <span><i [style.background]="s.color"></i>{{ s.name }}</span>
        }
      </figcaption>
    </figure>
  `,
  imports: [DecimalPipe],
  styles: `
    .chart { margin: 0; }
    svg { width: 100%; height: 240px; display: block; overflow: visible; }
    .grid { stroke: var(--mat-sys-outline-variant); stroke-width: 1; }
    .tick { font-size: 10.5px; fill: var(--mat-sys-on-surface-variant); font-family: Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; }
    rect { transition: opacity .15s; }
    rect:hover { opacity: .8; }
    .legend { display: flex; gap: 16px; margin-top: 8px; font: var(--mat-sys-label-medium); color: var(--mat-sys-on-surface-variant);
      span { display: inline-flex; align-items: center; gap: 6px; }
      i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    }
  `,
})
export class BarChartComponent {
  labels = input.required<string[]>();
  series = input.required<BarSeries[]>();
  ariaLabel = input('Bar chart');

  readonly W = 640;
  readonly H = 240;
  readonly padL = 44;
  readonly padR = 8;
  readonly padT = 8;
  readonly padB = 22;

  private readonly max = computed(() => {
    const m = Math.max(0, ...this.series().flatMap((s) => s.values));
    return niceCeil(m || 1);
  });

  readonly ticks = computed(() => {
    const max = this.max();
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const v = (max / steps) * i;
      return { y: this.yFor(v), label: compact(v) };
    });
  });

  readonly groups = computed(() => {
    const labels = this.labels();
    const series = this.series();
    const innerW = this.W - this.padL - this.padR;
    const groupW = innerW / Math.max(labels.length, 1);
    const gap = groupW * 0.38;
    const barW = (groupW - gap) / Math.max(series.length, 1);
    return labels.map((label, i) => {
      const x0 = this.padL + i * groupW + gap / 2;
      return {
        label,
        cx: this.padL + i * groupW + groupW / 2,
        bars: series.map((s, j) => {
          const value = s.values[i] ?? 0;
          const y = this.yFor(value);
          return { name: s.name, color: s.color, value, x: x0 + j * barW, w: Math.max(barW - 3, 1), y, h: Math.max(this.H - this.padB - y, 0) };
        }),
      };
    });
  });

  private yFor(v: number): number {
    const innerH = this.H - this.padT - this.padB;
    return this.padT + innerH - (v / this.max()) * innerH;
  }
}

function niceCeil(v: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * p;
}

function compact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return `${Math.round(v)}`;
}
