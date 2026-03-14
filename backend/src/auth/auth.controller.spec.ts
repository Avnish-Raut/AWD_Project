import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock the AuthService methods
  const mockAuthService = {
    register: jest
      .fn()
      .mockResolvedValue({ message: 'User registered', user_id: 1 }),
    login: jest.fn().mockResolvedValue({ access_token: 'fake-jwt-token' }),
    requestPasswordReset: jest
      .fn()
      .mockResolvedValue({ message: 'Password reset email sent' }),
    resetPassword: jest
      .fn()
      .mockResolvedValue({ message: 'Password successfully reset' }),
    getUserProfile: jest
      .fn()
      .mockResolvedValue({ user_id: 1, username: 'testuser' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with the correct DTO', async () => {
      const dto = {
        username: 'test',
        email: 'test@test.com',
        password: 'password',
        role: Role.USER,
      };

      const result = await controller.register(dto as any);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'User registered', user_id: 1 });
    });
  });

  describe('login', () => {
    it('should call authService.login with the correct DTO', async () => {
      const dto = { email: 'test@test.com', password: 'password' };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ access_token: 'fake-jwt-token' });
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.requestPasswordReset with the extracted email', async () => {
      const email = 'test@test.com';

      const result = await controller.forgotPassword(email);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(email);
      expect(result).toEqual({ message: 'Password reset email sent' });
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with token and password from DTO', async () => {
      const dto = { token: 'valid-token', password: 'new-password' };

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto.token,
        dto.password,
      );
      expect(result).toEqual({ message: 'Password successfully reset' });
    });
  });

  describe('getProfile', () => {
    it('should extract user.sub from the request and call authService.getUserProfile', async () => {
      // Mock the request object that the JwtAuthGuard injects
      const mockReq = {
        user: { sub: 1, email: 'test@test.com', role: 'USER' },
      };

      const result = await controller.getProfile(mockReq);

      expect(authService.getUserProfile).toHaveBeenCalledWith(mockReq.user.sub);
      expect(result).toEqual({ user_id: 1, username: 'testuser' });
    });
  });
});
