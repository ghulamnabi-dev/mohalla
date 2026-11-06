import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resident } from '../models';
import { CrudApi } from './crud.base';

@Injectable({ providedIn: 'root' })
export class ResidentsService extends CrudApi<Resident> {
  constructor() {
    super('Resident');
  }

  /** Look a resident up by name + house number (used before recording a payment). */
  check(name: string, houseNumber: string): Observable<Resident> {
    return this.http.post<Resident>(`${this.url}/checkResident`, { Name: name, houseNumber });
  }
}
