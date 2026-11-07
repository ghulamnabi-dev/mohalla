import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models';
import { TokenService } from './token.service';

const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenService);
  private readonly base = `${environment.apiUrl}/Auth`;

  private readonly _token = signal<string | null>(this.tokens.get());

  readonly isAuthenticated = computed(() => !!this._token() && !this.tokens.isExpired());

  /** Display name taken from the JWT `name` claim (falls back to the e-mail). */
  readonly userName = computed(() => {
    const p = this.tokens.payload();
    const name = (p?.[NAME_CLAIM] ?? p?.['name'] ?? p?.['unique_name']) as string | undefined;
    if (!name) return 'Account';
    // Show "ghulamnabi.dev" rather than the full address in the toolbar.
    return name.includes('@') ? name.split('@')[0] : name;
  });

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body).pipe(tap((r) => this.store(r.token)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, body).pipe(tap((r) => this.store(r.token)));
  }

  logout(): void {
    this.tokens.clear();
    this._token.set(null);
    void this.router.navigate(['/login']);
  }

  private store(token: string): void {
    this.tokens.set(token);
    this._token.set(token);
  }
}
