import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Expense } from '../models';
import { CrudApi } from './crud.base';

@Injectable({ providedIn: 'root' })
export class ExpensesService extends CrudApi<Expense> {
  constructor() {
    super('MonthlyExpense');
  }

  byMonth(month: number, year: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.url}/month/${month}/year/${year}`);
  }
}
