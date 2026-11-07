import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Role, UserAccount } from '../models';
import { TokenService } from './token.service';

const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenService);
  private readonly base = `${environment.apiUrl}/Auth`;

  private readonly _token = signal<string | null>(this.tokens.get());

  readonly isAuthenticated = computed(() => !!this._token() && !this.tokens.isExpired());

  /** Decoded JWT payload; re-evaluated whenever the token changes. */
  private readonly payload = computed(() => (this._token() ? this.tokens.payload() : null));

  /** Role from the JWT role claim. Anything other than "Admin" is treated as read-only. */
  readonly role = computed<Role>(() => {
    const raw = this.payload()?.[ROLE_CLAIM] ?? this.payload()?.['role'];
    const roles = Array.isArray(raw) ? raw : [raw];
    return roles.includes('Admin') ? 'Admin' : 'Viewer';
  });
  readonly isAdmin = computed(() => this.role() === 'Admin');

  /** The `fullName` claim, when the API issued one. */
  readonly fullName = computed(() => {
    const name = this.payload()?.['fullName'];
    return typeof name === 'string' && name.trim() ? name.trim() : null;
  });

  /** Display name: full name, else the JWT `name` claim (falls back to the e-mail). */
  readonly userName = computed(() => {
    const full = this.fullName();
    if (full) return full;
    const p = this.payload();
    const name = (p?.[NAME_CLAIM] ?? p?.['name'] ?? p?.['unique_name']) as string | undefined;
    if (!name) return 'Account';
    // Show "ghulamnabi.dev" rather than the full address in the toolbar.
    return name.includes('@') ? name.split('@')[0] : name;
  });

  /** Full e-mail address from the token, if the name claim is one. */
  readonly userEmail = computed(() => {
    const p = this.payload();
    const name = (p?.[NAME_CLAIM] ?? p?.['name'] ?? p?.['unique_name'] ?? p?.['email']) as string | undefined;
    return name?.includes('@') ? name : null;
  });

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body).pipe(tap((r) => this.store(r.token)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, body).pipe(tap((r) => this.store(r.token)));
  }

  /** The signed-in account as the API sees it. */
  me(): Observable<UserAccount> {
    return this.http.get<UserAccount>(`${this.base}/me`);
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
