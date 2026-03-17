import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment.development';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no unmatched requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user profile', () => {
    const mockProfile = { id: 1, name: 'John' };

    service.getProfile().subscribe((res) => {
      expect(res).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${apiUrl}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('should update user profile', () => {
    const updateData = { name: 'Jane' };
    const mockResponse = { id: 1, name: 'Jane' };

    service.updateProfile(updateData).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/me`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockResponse);
  });

  it('should delete user account', () => {
    service.deleteAccount().subscribe((res) => {
      expect(res).toEqual({ success: true });
    });

    const req = httpMock.expectOne(`${apiUrl}/me`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('should upload avatar', () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const mockResponse = { avatarUrl: 'http://example.com/avatar.png' };

    service.uploadAvatar(file).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/me/avatar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.has('file')).toBeTrue();
    req.flush(mockResponse);
  });

  it('should delete avatar', () => {
    const mockResponse = { success: true };

    service.deleteAvatar().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/me/avatar`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });
});
