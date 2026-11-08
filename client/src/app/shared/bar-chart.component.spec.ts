import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChartComponent, BarSeries } from './bar-chart.component';

describe('BarChartComponent', () => {
  let fixture: ComponentFixture<BarChartComponent>;
  let el: HTMLElement;

  function render(labels: string[], series: BarSeries[]) {
    fixture.componentRef.setInput('labels', labels);
    fixture.componentRef.setInput('series', series);
    fixture.detectChanges();
  }
  const ticks = () => Array.from(el.querySelectorAll('text.tick')).map((t) => t.textContent!.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BarChartComponent] });
    fixture = TestBed.createComponent(BarChartComponent);
    el = fixture.nativeElement;
  });

  it('renders one rect per value across all series', () => {
    render(['Jan', 'Feb', 'Mar'], [
      { name: 'Collected', color: 'red', values: [10, 20, 30] },
      { name: 'Spent', color: 'blue', values: [5, 15, 25] },
    ]);
    expect(el.querySelectorAll('rect').length).toBe(6);
  });

  it('shows a label for every group and a legend entry for every series', () => {
    render(['Jan', 'Feb'], [
      { name: 'Collected', color: 'red', values: [1, 2] },
      { name: 'Spent', color: 'blue', values: [1, 2] },
    ]);
    expect(ticks()).toEqual(jasmine.arrayContaining(['Jan', 'Feb']));
    expect(el.querySelector('.legend')!.textContent).toContain('Collected');
    expect(el.querySelector('.legend')!.textContent).toContain('Spent');
  });

  it('formats y-axis ticks as compact numbers', () => {
    render(['Jan'], [{ name: 'A', color: 'red', values: [50000] }]);
    expect(ticks()).toEqual(jasmine.arrayContaining(['0', '13k', '25k', '38k', '50k']));
  });

  it('uses M for millions', () => {
    render(['Jan'], [{ name: 'A', color: 'red', values: [2_000_000] }]);
    expect(ticks()).toContain('2M');
  });

  it('rounds the top tick up to a "nice" ceiling', () => {
    render(['Jan'], [{ name: 'A', color: 'red', values: [43000] }]);
    expect(ticks()).toContain('50k');
    expect(ticks()).not.toContain('43k');
  });

  it('never produces a bar with negative height, even for negative or missing values', () => {
    render(['Jan', 'Feb'], [{ name: 'A', color: 'red', values: [-500] }, { name: 'B', color: 'blue', values: [100, 200] }]);
    const heights = Array.from(el.querySelectorAll('rect')).map((r) => Number(r.getAttribute('height')));
    expect(heights.length).toBe(4);
    expect(heights.every((h) => h >= 0)).toBeTrue();
  });

  it('copes with all-zero data', () => {
    render(['Jan'], [{ name: 'A', color: 'red', values: [0] }]);
    expect(Number(el.querySelector('rect')!.getAttribute('height'))).toBe(0);
    expect(ticks()).toContain('0');
  });

  it('makes the tallest bar taller than a shorter one', () => {
    render(['Jan', 'Feb'], [{ name: 'A', color: 'red', values: [10, 40] }]);
    const [a, b] = Array.from(el.querySelectorAll('rect')).map((r) => Number(r.getAttribute('height')));
    expect(b).toBeGreaterThan(a);
  });
});
