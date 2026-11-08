import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

function jwt(payload: unknown): string {
  return `h.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.s`;
}

describe('AuthService', () => {
  let http: HttpTestingController;
  let tokens: TokenService;
  let router: jasmine.SpyObj<Router>;

  function setup(): AuthService {
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }],
    });
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.removeItem('mohalla.token'));
  afterEach(() => localStorage.removeItem('mohalla.token'));

  it('is not authenticated without a token', () => {
    expect(setup().isAuthenticated()).toBeFalse();
  });

  it('stores the token and becomes authenticated after login', () => {
    const auth = setup();
    const token = jwt({ name: 'x' });
    auth.login({ email: 'a@b.c', password: 'pw' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/Auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.c', password: 'pw' });
    req.flush({ token });

    expect(tokens.get()).toBe(token);
    expect(auth.isAuthenticated()).toBeTrue();
  });

  it('is not authenticated when the stored token is expired', () => {
    localStorage.setItem('mohalla.token', jwt({ exp: 1 }));
    expect(setup().isAuthenticated()).toBeFalse();
  });

  it('clears the token and navigates to /login on logout', () => {
    const auth = setup();
    auth.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    http.expectOne(`${environment.apiUrl}/Auth/login`).flush({ token: jwt({}) });

    auth.logout();

    expect(tokens.get()).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  describe('userName', () => {
    it('is "Account" when there is no token', () => {
      expect(setup().userName()).toBe('Account');
    });

    it('returns the part before "@" when the name claim is an e-mail', () => {
      localStorage.setItem('mohalla.token', jwt({ [NAME_CLAIM]: 'ghulam.nabi@example.com' }));
      expect(setup().userName()).toBe('ghulam.nabi');
    });

    it('returns the name unchanged when it is not an e-mail', () => {
      localStorage.setItem('mohalla.token', jwt({ name: 'Ghulam Nabi' }));
      expect(setup().userName()).toBe('Ghulam Nabi');
    });
  });
});
