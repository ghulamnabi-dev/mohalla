import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Fund } from '../models';
import { CrudApi } from './crud.base';

@Injectable({ providedIn: 'root' })
export class FundsService extends CrudApi<Fund> {
  constructor() {
    super('MonthlyFund');
  }

  byMonth(month: number): Observable<Fund[]> {
    return this.http.get<Fund[]>(`${this.url}/month/${month}`);
  }

  byResident(residentId: number): Observable<Fund[]> {
    return this.http.get<Fund[]>(`${this.url}/resident/${residentId}`);
  }
}
