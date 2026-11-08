import { Fund } from '../../core/models';
import { withRunningBalance } from './statement';

const fund = (id: number, year: number, month: number, amount: number, paidAmount: number, datePaid = 5): Fund => ({
  id, year, month, datePaid, amount, paidAmount, paidTo: 'Treasurer', outstanding: amount - paidAmount, residentId: 1,
});

describe('withRunningBalance', () => {
  it('returns an empty list for no payments', () => {
    expect(withRunningBalance([])).toEqual([]);
  });

  it('sorts newest first and accumulates due minus paid from the oldest line', () => {
    // Deliberately out of order, spanning a year boundary.
    const rows = withRunningBalance([
      fund(3, 2026, 1, 4000, 4000),
      fund(1, 2025, 11, 4000, 2500),
      fund(4, 2026, 2, 4000, 3000),
      fund(2, 2025, 12, 4000, 4000),
    ]);

    expect(rows.map((r) => r.id)).toEqual([4, 3, 2, 1]);
    // Oldest → newest: +1500, +0, +0, +1000
    expect(rows.map((r) => r.runningBalance)).toEqual([2500, 1500, 1500, 1500]);
    expect(rows.map((r) => r.short)).toEqual([1000, 0, 0, 1500]);
  });

  it('lets an overpayment bring the balance back down without a negative shortfall', () => {
    const rows = withRunningBalance([fund(1, 2026, 1, 4000, 2000), fund(2, 2026, 2, 4000, 6000)]);
    expect(rows[0]).toEqual(jasmine.objectContaining({ id: 2, short: 0, runningBalance: 0 }));
    expect(rows[1]).toEqual(jasmine.objectContaining({ id: 1, short: 2000, runningBalance: 2000 }));
  });

  it('orders same-month lines by day, then id, and does not mutate the input', () => {
    const input = [fund(9, 2026, 3, 1000, 0, 20), fund(7, 2026, 3, 1000, 1000, 2), fund(8, 2026, 3, 1000, 500, 2)];
    const copy = structuredClone(input);
    const rows = withRunningBalance(input);
    expect(rows.map((r) => r.id)).toEqual([9, 8, 7]);
    expect(rows.map((r) => r.runningBalance)).toEqual([1500, 500, 0]);
    expect(input).toEqual(copy);
  });
});
