import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersService, UsersResponse, User } from './users.service';
import { environment } from '../../../../environments/environment';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'USER',
    created_at: '2026-01-01',
    deleted_at: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService]
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifies that no requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- BRANCH COVERAGE: getUsers with Params ---
  it('should get users with search, skip, and take params', () => {
    const mockResponse: UsersResponse = { data: [mockUser], total: 1 };

    service.getUsers('john', 5, 10).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request => 
      request.url === apiUrl &&
      request.params.get('search') === 'john' &&
      request.params.get('skip') === '5' &&
      request.params.get('take') === '10'
    );
    
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // --- BRANCH COVERAGE: getUsers without Params ---
  it('should get users without params', () => {
    service.getUsers().subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.params.has('search')).toBeFalse();
    req.flush({ data: [], total: 0 });
  });

  // --- FUNCTION COVERAGE: updateUserRole ---
  it('should update user role via PATCH', () => {
    service.updateUserRole(1, 'ADMIN').subscribe(user => {
      expect(user.role).toBe('ADMIN');
    });

    const req = httpMock.expectOne(`${apiUrl}/1/role`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'ADMIN' });
    req.flush({ ...mockUser, role: 'ADMIN' });
  });

  // --- FUNCTION COVERAGE: deactivateUser ---
  it('should deactivate user via DELETE', () => {
    const expectedResponse = { message: 'Deactivated', user_id: 1 };

    service.deactivateUser(1).subscribe(res => {
      expect(res).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(expectedResponse);
  });

  // --- FUNCTION COVERAGE: reactivateUser ---
  it('should reactivate user via POST', () => {
    service.reactivateUser(1).subscribe(user => {
      expect(user.user_id).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/1/reactivate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(mockUser);
  });
});