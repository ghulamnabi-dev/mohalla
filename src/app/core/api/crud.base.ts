import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Shared CRUD surface for the API's resource controllers. */
export abstract class CrudApi<T extends { id: number }> {
  protected readonly http = inject(HttpClient);
  protected readonly url: string;

  protected constructor(controller: string) {
    this.url = `${environment.apiUrl}/${controller}`;
  }

  list(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  get(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  create(body: Omit<T, 'id'> | T): Observable<T> {
    return this.http.post<T>(this.url, { ...body, id: 0 });
  }

  update(id: number, body: T): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
