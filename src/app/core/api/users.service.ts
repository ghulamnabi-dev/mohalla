import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, UserAccount } from '../models';

/** Account administration (Admin only on the API side). */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/Auth/users`;

  list(): Observable<UserAccount[]> {
    return this.http.get<UserAccount[]>(this.url);
  }

  setRole(id: string, role: Role): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/role`, { role });
  }
}
