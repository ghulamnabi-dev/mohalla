import { Fund } from '../../core/models';

/** A statement line: the payment plus what the household owes after it. */
export interface StatementRow extends Fund {
  /** Amount due minus amount paid on this line (never negative). */
  short: number;
  /** Cumulative (due − paid) from the oldest line up to and including this one. */
  runningBalance: number;
}

const periodKey = (f: Fund) => f.year * 10000 + f.month * 100 + f.datePaid;

/**
 * Sort payments newest first and attach a running balance computed oldest → newest.
 * Ties on the same day keep a stable order by id so the balance is deterministic.
 */
export function withRunningBalance(payments: readonly Fund[]): StatementRow[] {
  const oldestFirst = [...payments].sort((a, b) => periodKey(a) - periodKey(b) || a.id - b.id);
  let balance = 0;
  const rows = oldestFirst.map((f) => {
    balance += f.amount - f.paidAmount;
    return { ...f, short: Math.max(f.amount - f.paidAmount, 0), runningBalance: balance };
  });
  return rows.reverse();
}
