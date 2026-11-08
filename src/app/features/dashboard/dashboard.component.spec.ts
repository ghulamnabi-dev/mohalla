import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoriesService } from '../../core/api/categories.service';
import { ExpensesService } from '../../core/api/expenses.service';
import { FundsService } from '../../core/api/funds.service';
import { ResidentsService } from '../../core/api/residents.service';
import { SummariesService } from '../../core/api/summaries.service';
import { Expense, ExpenseCategory, Fund, Resident, Summary } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const residents: Resident[] = [
    { id: 1, ownerName: 'Ali', phoneNumber: '', street: 'A', houseNumber: '1' },
    { id: 2, ownerName: 'Bilal', phoneNumber: '', street: 'A', houseNumber: '2' },
    { id: 3, ownerName: 'Chaudhry', phoneNumber: '', street: 'B', houseNumber: '3' },
    { id: 4, ownerName: 'Danish', phoneNumber: '', street: 'B', houseNumber: '4' },
  ];
  const fund = (id: number, residentId: number, paidAmount: number, datePaid: number, over: Partial<Fund> = {}): Fund => ({
    id, residentId, paidAmount, datePaid, month, year, amount: 1000, paidTo: 'Treasurer', outstanding: 0, ...over,
  });
  const funds: Fund[] = [fund(1, 1, 1000, 5), fund(2, 2, 600, 10)];
  const expense = (id: number, amount: number, expenseDate: number, categoryId = 1): Expense => ({
    id, amount, expenseDate, categoryId, month, year, description: `Expense ${id}`,
  });
  const expenses: Expense[] = [expense(1, 300, 7), expense(2, 200, 20)];
  const categories: ExpenseCategory[] = [{ id: 1, name: 'Cleaning' }];
  const summary = (m: number, y: number, totalFund = 0, exp = 0, closingBalance = 0): Summary => ({
    id: y * 100 + m, month: m, year: y, openningBalance: 0, totalFund, expense: exp, closingBalance,
  });

  function create(data: { funds?: Fund[]; expenses?: Expense[]; summaries?: Summary[] } = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ResidentsService, useValue: { list: () => of(residents) } },
        { provide: FundsService, useValue: { byMonth: jasmine.createSpy('byMonth').and.returnValue(of(data.funds ?? funds)) } },
        { provide: ExpensesService, useValue: { byMonth: () => of(data.expenses ?? expenses) } },
        { provide: SummariesService, useValue: { list: () => of(data.summaries ?? []) } },
        { provide: CategoriesService, useValue: { list: () => of(categories) } },
        { provide: NotificationService, useValue: { error: jasmine.createSpy('error') } },
      ],
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    return fixture.componentInstance;
  }

  it('loads on construction and stops loading', () => {
    const c = create();
    expect(c.loading()).toBeFalse();
    expect(c.residents().length).toBe(4);
  });

  it('totals collected, spent and shortfall for the month', () => {
    const c = create();
    expect(c.collected()).toBe(1600);
    expect(c.spent()).toBe(500);
    expect(c.shortfall()).toBe(400);
  });

  it('never counts an overpayment as a negative shortfall', () => {
    const c = create({ funds: [fund(1, 1, 1500, 5), fund(2, 2, 600, 10)] });
    expect(c.shortfall()).toBe(400);
  });

  it('ignores payments recorded for a different year', () => {
    const c = create({ funds: [...funds, fund(3, 3, 1000, 12, { year: year - 1 })] });
    expect(c.collected()).toBe(1600);
    expect(c.paidCount()).toBe(2);
  });

  it('lists residents without a payment as unpaid', () => {
    const c = create();
    expect(c.paidCount()).toBe(2);
    expect(c.unpaid().map((r) => r.id)).toEqual([3, 4]);
  });

  it('rounds the collection percentage of residents who have paid', () => {
    expect(create().collectionPct()).toBe(50);
    TestBed.resetTestingModule();
    expect(create({ funds: [fund(1, 1, 1000, 5)] }).collectionPct()).toBe(25);
  });

  it('reports 0% collection when there are no payments', () => {
    expect(create({ funds: [] }).collectionPct()).toBe(0);
  });

  describe('versus the previous month', () => {
    it('computes percentage change in collected and spent', () => {
      const c = create({ summaries: [summary(prevMonth, prevYear, 800, 1000)] });
      expect(c.collectedDelta()).toBe(100); // 1600 vs 800
      expect(c.spentDelta()).toBe(-50); // 500 vs 1000
    });

    it('is null when there is no previous-month summary', () => {
      const c = create({ summaries: [summary(month, year, 1600, 500)] });
      expect(c.previous()).toBeNull();
      expect(c.collectedDelta()).toBeNull();
      expect(c.spentDelta()).toBeNull();
      expect(c.prevLabel()).toBeUndefined();
    });

    it('is null when the previous month had a zero base', () => {
      const c = create({ summaries: [summary(prevMonth, prevYear, 0, 0)] });
      expect(c.collectedDelta()).toBeNull();
      expect(c.spentDelta()).toBeNull();
    });
  });

  describe('last12', () => {
    it('keeps the latest 12 summaries in chronological order', () => {
      const unordered = [
        summary(3, 2024), summary(12, 2023), summary(1, 2024), summary(2, 2023), summary(6, 2024),
        summary(11, 2023), summary(2, 2024), summary(4, 2024), summary(5, 2024), summary(10, 2023),
        summary(9, 2023), summary(8, 2023), summary(7, 2023),
      ];
      const c = create({ summaries: unordered });
      const keys = c.last12().map((s) => s.year * 100 + s.month);
      expect(keys.length).toBe(12);
      expect(keys).toEqual([...keys].sort((a, b) => a - b));
      expect(keys[0]).toBe(202307); // Feb 2023 dropped as the oldest
      expect(keys[11]).toBe(202406);
    });

    it('feeds the chart with collected and spent values in that order', () => {
      const c = create({ summaries: [summary(2, 2024, 20, 2), summary(1, 2024, 10, 1)] });
      expect(c.chartLabels()).toEqual(['Jan 24', 'Feb 24']);
      expect(c.chartSeries().map((s) => s.values)).toEqual([[10, 20], [1, 2]]);
    });
  });

  describe('activity', () => {
    it('merges payments and expenses, newest day first, with expenses negative', () => {
      const c = create();
      expect(c.activity().map((a) => [a.id, a.day, a.amount])).toEqual([
        ['e2', 20, -200],
        ['p2', 10, 600],
        ['e1', 7, -300],
        ['p1', 5, 1000],
      ]);
    });

    it('describes payments with the resident and expenses with the category', () => {
      const a = create().activity();
      expect(a.find((x) => x.id === 'p1')).toEqual(jasmine.objectContaining({ title: 'Ali', detail: 'House 1', kind: 'payment' }));
      expect(a.find((x) => x.id === 'e1')).toEqual(jasmine.objectContaining({ detail: 'Cleaning', kind: 'expense' }));
    });

    it('flags a partial payment with the amount still short', () => {
      const p2 = create().activity().find((x) => x.id === 'p2')!;
      expect(p2.detail).toBe('Partial, Rs 400 short');
    });

    it('limits the list to the 8 most recent entries', () => {
      const many = Array.from({ length: 10 }, (_, i) => expense(i + 1, 10, i + 1));
      const c = create({ expenses: many, funds: [] });
      const days = c.activity().map((a) => a.day);
      expect(days).toEqual([10, 9, 8, 7, 6, 5, 4, 3]);
    });
  });
});
