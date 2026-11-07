import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resident, ResidentStatement } from '../models';
import { CrudApi } from './crud.base';

@Injectable({ providedIn: 'root' })
export class ResidentsService extends CrudApi<Resident> {
  constructor() {
    super('Resident');
  }

  /** Header, payment history (newest first) and totals for one household. */
  statement(id: number): Observable<ResidentStatement> {
    return this.http.get<ResidentStatement>(`${this.url}/${id}/statement`);
  }

  /** Look a resident up by name + house number (used before recording a payment). */
  check(name: string, houseNumber: string): Observable<Resident> {
    return this.http.post<Resident>(`${this.url}/checkResident`, { Name: name, houseNumber });
  }
}
