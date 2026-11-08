import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { FundsService } from '../../core/api/funds.service';
import { ResidentsService } from '../../core/api/residents.service';
import { Fund, Resident } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { FundsComponent } from './funds.component';

describe('FundsComponent', () => {
  const residents: Resident[] = [
    { id: 1, ownerName: 'Ali', phoneNumber: '', street: 'A', houseNumber: '11' },
    { id: 2, ownerName: 'Bilal', phoneNumber: '', street: 'A', houseNumber: '22' },
  ];
  const fund = (id: number, residentId: number, year: number, month: number, amount: number, paidAmount: number): Fund => ({
    id, residentId, year, month, amount, paidAmount, datePaid: 1, paidTo: 'Treasurer', outstanding: 0,
  });
  const funds: Fund[] = [
    fund(1, 1, 2024, 1, 1000, 1000),
    fund(2, 2, 2024, 1, 1000, 400),
    fund(3, 1, 2024, 2, 1000, 1200), // overpaid
    fund(4, 2, 2023, 12, 1000, 0),
    fund(5, 99, 2024, 2, 500, 500), // unknown resident
  ];

  const dialog = { open: jasmine.createSpy('open') };

  beforeEach(() => dialog.open.calls.reset());

  function create(queryParams: Record<string, string> = {}, admin = true) {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: { isAdmin: () => admin, role: () => (admin ? 'Admin' : 'Viewer') } },
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FundsService, useValue: { list: () => of(funds) } },
        { provide: ResidentsService, useValue: { list: () => of(residents) } },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['error', 'success']) },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });
    // The component imports MatDialogModule (which provides the real MatDialog), so swap it out.
    TestBed.overrideComponent(FundsComponent, {
      remove: { imports: [MatDialogModule] },
      add: { providers: [{ provide: MatDialog, useValue: dialog }] },
    });
    const fixture = TestBed.createComponent(FundsComponent);
    const c = fixture.componentInstance;
    c.year.set('all');
    return c;
  }

  it('joins each payment with its resident name and house number', () => {
    const c = create();
    const row = c.all().find((r) => r.id === 2)!;
    expect(row.residentName).toBe('Bilal');
    expect(row.houseNumber).toBe('22');
  });

  it('labels payments of unknown residents as "Unknown"', () => {
    const row = create().all().find((r) => r.id === 5)!;
    expect(row.residentName).toBe('Unknown');
    expect(row.houseNumber).toBe('');
  });

  it('stops loading once data arrives', () => {
    expect(create().loading()).toBeFalse();
  });

  it('shows every payment when both filters are "all"', () => {
    expect(create().visible().length).toBe(5);
  });

  it('narrows visible payments by year', () => {
    const c = create();
    c.year.set(2023);
    expect(c.visible().map((f) => f.id)).toEqual([4]);
  });

  it('narrows visible payments by month', () => {
    const c = create();
    c.month.set(2);
    expect(c.visible().map((f) => f.id)).toEqual([3, 5]);
  });

  it('combines year and month filters', () => {
    const c = create();
    c.year.set(2024);
    c.month.set(1);
    expect(c.visible().map((f) => f.id)).toEqual([1, 2]);
  });

  it('lists the available years newest first', () => {
    expect(create().years()).toEqual([2024, 2023]);
  });

  it('totals the paid amount of the visible payments', () => {
    const c = create();
    c.year.set(2024);
    c.month.set(1);
    expect(c.totalPaid()).toBe(1400);
  });

  it('totals the amount still due, ignoring overpayments', () => {
    const c = create();
    c.year.set(2024);
    c.month.set(1);
    expect(c.totalDue()).toBe(600);
    c.month.set(2);
    expect(c.totalDue()).toBe(0); // 1200 paid on 1000 due, and 500 on 500
  });

  it('pushes the visible rows into the table data source on apply()', () => {
    const c = create();
    c.year.set(2023);
    c.apply();
    expect(c.data.data.map((f) => f.id)).toEqual([4]);
  });

  it('filters the table by resident name, ignoring case and whitespace', () => {
    const c = create();
    c.apply();
    c.filter('  BILAL ');
    expect(c.data.filteredData.map((f) => f.id)).toEqual([2, 4]);
  });

  it('does not open the dialog without ?add', async () => {
    create();
    await Promise.resolve();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('opens the payment dialog on construction when ?add is present', async () => {
    dialog.open.and.returnValue({ afterClosed: () => of(false) });
    create({ add: '1' });
    await Promise.resolve();
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('ignores ?add for read-only users', async () => {
    create({ add: '1' }, false);
    await Promise.resolve();
    expect(dialog.open).not.toHaveBeenCalled();
  });
});
