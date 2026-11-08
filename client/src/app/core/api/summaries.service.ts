import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Summary } from '../models';
import { CrudApi } from './crud.base';

@Injectable({ providedIn: 'root' })
export class SummariesService extends CrudApi<Summary> {
  constructor() {
    super('MonthlySummary');
  }

  byMonth(month: number, year: number): Observable<Summary> {
    return this.http.get<Summary>(`${this.url}/month/${month}/year/${year}`);
  }
}
