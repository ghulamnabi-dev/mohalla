#!/usr/bin/env node
/**
 * Seeds a running Mohalla API with a realistic demo dataset:
 * 13 residents, 6 expense categories, 12 months of contributions and expenses,
 * and the matching monthly ledger rows (computed by the API itself).
 *
 *   npm run seed                              # API at http://localhost:5091, creates demo@sms.local
 *   API_URL=https://my-api/api EMAIL=... PASSWORD=... npm run seed
 *
 * Safe to re-run: residents and categories that already exist are reused.
 */
const API = (process.env.API_URL ?? 'http://localhost:5091/api').replace(/\/$/, '');
const EMAIL = process.env.EMAIL ?? 'demo@mohalla.local';
const PASSWORD = process.env.PASSWORD ?? 'Demo#Pass2026';

const log = (...a) => console.log('[seed]', ...a);

async function call(method, path, body, token) {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json();
}

async function signIn() {
  try {
    return (await call('POST', 'Auth/login', { email: EMAIL, password: PASSWORD })).token;
  } catch {
    log(`creating account ${EMAIL}`);
    return (await call('POST', 'Auth/register', { fullName: 'Demo Admin', email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD })).token;
  }
}

const RESIDENTS = [
  ['Ahmed Raza', 'Street 4', '12'], ['Sana Malik', 'Street 4', '14'], ['Bilal Khan', 'Street 7', '21'], ['Hira Shah', 'Street 7', '23'],
  ['Usman Tariq', 'Street 12', '30'], ['Ayesha Noor', 'Street 12', '32'], ['Hamza Iqbal', 'Street 4', '16'], ['Zara Ali', 'Street 9', '41'],
  ['Fahad Mirza', 'Street 9', '43'], ['Mariam Siddiqui', 'Street 12', '34'], ['Omar Farooq', 'Street 4', '18'], ['Nida Hussain', 'Street 7', '25'],
  ['Taha Qureshi', 'Street 9', '45'],
];
const CATEGORIES = ['Security', 'Water', 'Generator', 'Cleaning', 'Maintenance', 'Street lights'];
const MONTHLY_DUE = 4000;

const token = await signIn();
const t = (m, p, b) => call(m, p, b, token);

// Residents & categories (idempotent)
const existingResidents = await t('GET', 'Resident');
for (const [i, [ownerName, street, houseNumber]] of RESIDENTS.entries()) {
  if (!existingResidents.some((r) => r.houseNumber === houseNumber && r.street === street)) {
    await t('POST', 'Resident', { id: 0, ownerName, street, houseNumber, phoneNumber: `03${String(10 + i)}1234567` });
  }
}
const residents = await t('GET', 'Resident');

const existingCats = await t('GET', 'ExpenseCategory');
for (const name of CATEGORIES) if (!existingCats.some((c) => c.name === name)) await t('POST', 'ExpenseCategory', { id: 0, name });
const cats = await t('GET', 'ExpenseCategory');
const catId = (n) => cats.find((c) => c.name === n).id;
log(`${residents.length} residents, ${cats.length} categories`);

// 12 months, oldest first so opening balances roll forward
const existingSummaries = await t('GET', 'MonthlySummary');
const now = new Date();
let funds = 0, expenses = 0;
for (let k = 11; k >= 0; k--) {
  const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
  const month = d.getMonth() + 1, year = d.getFullYear();
  if (existingSummaries.some((s) => s.month === month && s.year === year)) { log(`skip ${month}/${year} (already has a ledger row)`); continue; }

  await t('POST', 'MonthlySummary', { id: 0, month, year, openningBalance: 0, totalFund: 0, expense: 0, closingBalance: 0 });

  for (const r of residents) {
    if (k === 0 && r.id % 5 === 0) continue;                  // a few unpaid in the current month
    const paidAmount = (r.id + k) % 4 === 0 ? 2500 : MONTHLY_DUE; // some partial payments
    await t('POST', 'MonthlyFund', { id: 0, month, year, datePaid: 1 + (r.id * 3) % 26, paidTo: 'Treasurer', amount: MONTHLY_DUE, paidAmount, outstanding: MONTHLY_DUE - paidAmount, residentId: r.id });
    funds++;
  }

  const items = [
    ['Security', 18000, 'Guard salaries', 1], ['Water', 6500, 'Water tanker', 6], ['Generator', 9200 + (k % 3) * 800, 'Generator fuel', 10],
    ['Cleaning', 4000, 'Sweeper', 15], ['Maintenance', 2500 + k * 300, 'Repairs', 20],
  ];
  if (k % 4 === 0) items.push(['Street lights', 5500, 'Street light replacement', 24]);
  for (const [c, amount, description, expenseDate] of items) {
    await t('POST', 'MonthlyExpense', { id: 0, amount, month, year, description, expenseDate, categoryId: catId(c) });
    expenses++;
  }
  log(`${String(month).padStart(2, '0')}/${year} seeded`);
}

const summaries = await t('GET', 'MonthlySummary');
const latest = summaries.sort((a, b) => a.year - b.year || a.month - b.month).at(-1);
log(`done: +${funds} payments, +${expenses} expenses, ${summaries.length} ledger rows; latest closing balance Rs ${latest?.closingBalance?.toLocaleString('en-PK')}`);
log(`sign in with ${EMAIL} / ${PASSWORD}`);
