import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment.development';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/auth`;
  const eventsUrl = `${environment.apiUrl}/events`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear(); // reset before each test
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call register API', () => {
    const mockDto = { username: 'test', email: 'a@test.com', password: '123' };

    service.register(mockDto).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockDto);

    req.flush({});
  });

  it('should login and store token', () => {
    const mockResponse = { access_token: 'fake-token' };

    service.login({ email: 'a@test.com', password: '123' }).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush(mockResponse);

    expect(localStorage.getItem('token')).toBe('fake-token');
  });

  it('should call reset password API', () => {
    const dto = { token: 'abc', password: 'newpass' };

    service.reset(dto).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/reset-password`);
    expect(req.request.method).toBe('POST');

    req.flush({});
  });

  it('should remove token on logout', () => {
    localStorage.setItem('token', 'abc');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should return token', () => {
    localStorage.setItem('token', 'abc');

    expect(service.getToken()).toBe('abc');
  });

  it('should return true if token exists', () => {
    localStorage.setItem('token', 'abc');

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should return false if no token', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should call forgot password API', () => {
    service.forgotPassword('test@mail.com').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');

    req.flush({});
  });

  it('should fetch profile', () => {
    service.getProfile().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/profile`);
    expect(req.request.method).toBe('GET');

    req.flush({});
  });

  it('should fetch user events', () => {
    service.getUserEvents().subscribe();

    const req = httpMock.expectOne(`${eventsUrl}/my/user-events`);
    expect(req.request.method).toBe('GET');

    req.flush([]);
  });

  it('should cancel registration', () => {
    service.cancelRegistration(1).subscribe();

    const req = httpMock.expectOne(`${eventsUrl}/1/cancel-registration`);
    expect(req.request.method).toBe('DELETE');

    req.flush({});
  });

  it('should decode role from token', () => {
    const payload = btoa(JSON.stringify({ role: 'USER' }));
    const token = `header.${payload}.signature`;

    localStorage.setItem('token', token);

    expect(service.getRole()).toBe('USER');
  });

  it('should return null for invalid token', () => {
    localStorage.setItem('token', 'invalid.token');

    expect(service.getRole()).toBeNull();
  });

  it('should decode user id from token', () => {
    const payload = btoa(JSON.stringify({ sub: 123 }));
    const token = `header.${payload}.signature`;

    localStorage.setItem('token', token);

    expect(service.getUserId()).toBe(123);
  });

  it('should return null if no token', () => {
    expect(service.getUserId()).toBeNull();
  });

  it('should return null if no token in getRole', () => {
    localStorage.removeItem('token');

    expect(service.getRole()).toBeNull();
  });

  it('should return null if role is missing in token', () => {
    const payload = btoa(JSON.stringify({}));
    const token = `header.${payload}.signature`;

    localStorage.setItem('token', token);

    expect(service.getRole()).toBeNull();
  });

  it('should return null for malformed token in getUserId', () => {
    localStorage.setItem('token', 'bad.token.value');

    expect(service.getUserId()).toBeNull();
  });

  it('should return null if sub is missing', () => {
    const payload = btoa(JSON.stringify({}));
    const token = `header.${payload}.signature`;

    localStorage.setItem('token', token);

    expect(service.getUserId()).toBeNull();
  });

  it('should overwrite existing token on login', () => {
    localStorage.setItem('token', 'old-token');

    service.login({ email: 'a@test.com', password: '123' }).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush({ access_token: 'new-token' });

    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('should return false when token is empty string', () => {
    localStorage.setItem('token', '');

    expect(service.isLoggedIn()).toBeFalse();
  });
});
