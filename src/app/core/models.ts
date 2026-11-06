export interface Resident {
  id: number;
  ownerName: string;
  phoneNumber: string;
  street: string;
  houseNumber: string;
}

export interface Fund {
  id: number;
  month: number;
  year: number;
  datePaid: number;
  paidTo: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  residentId: number;
}

/** Fund joined with its resident for display. */
export interface FundRow extends Fund {
  residentName: string;
  houseNumber: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Expense {
  id: number;
  amount: number;
  month: number;
  year: number;
  description: string;
  expenseDate: number;
  categoryId: number;
}

export interface ExpenseRow extends Expense {
  categoryName: string;
}

export interface Summary {
  id: number;
  month: number;
  year: number;
  /** Spelled as the API returns it. */
  openningBalance: number;
  totalFund: number;
  expense: number;
  closingBalance: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export function monthName(month: number, short = false): string {
  const name = MONTHS[month - 1] ?? '';
  return short ? name.slice(0, 3) : name;
}

/** Build a JS Date from the API's split day/month/year fields. */
export function toDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, Math.min(Math.max(day, 1), 31));
}
