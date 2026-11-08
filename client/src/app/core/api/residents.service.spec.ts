import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Resident } from '../models';
import { ResidentsService } from './residents.service';

describe('ResidentsService (CrudApi)', () => {
  const url = `${environment.apiUrl}/Resident`;
  const resident: Resident = { id: 7, ownerName: 'Ali', phoneNumber: '0300', street: 'Main', houseNumber: '12' };
  let service: ResidentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ResidentsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lists residents with GET on the collection', () => {
    let result: Resident[] | undefined;
    service.list().subscribe((r) => (result = r));
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([resident]);
    expect(result).toEqual([resident]);
  });

  it('gets one resident with GET on /{id}', () => {
    let result: Resident | undefined;
    service.get(7).subscribe((r) => (result = r));
    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('GET');
    req.flush(resident);
    expect(result).toEqual(resident);
  });

  it('creates with POST and always sends id 0', () => {
    service.create(resident).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ...resident, id: 0 });
    req.flush(resident);
  });

  it('updates with PUT on /{id} and the full body', () => {
    service.update(7, resident).subscribe();
    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(resident);
    req.flush(null);
  });

  it('deletes with DELETE on /{id}', () => {
    service.delete(7).subscribe();
    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('checks a resident by name and house number via POST /checkResident', () => {
    service.check('Ali', '12').subscribe();
    const req = http.expectOne(`${url}/checkResident`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ Name: 'Ali', houseNumber: '12' });
    req.flush(resident);
  });
});
