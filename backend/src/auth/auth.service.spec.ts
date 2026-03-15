import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('fake-hex-token'),
  }),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;
  let mailService: MailService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Register Tests ──────────────────────────────────────────

  describe('register', () => {
    const registerDto = {
      username: 'test',
      email: 'test@test.com',
      password: 'password',
      role: Role.USER,
    };

    it('should successfully register a user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ user_id: 1 });

      const result = await service.register(registerDto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User registered', user_id: 1 });
    });

    it('should throw ConflictException if email is taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'test@test.com' });

      await expect(service.register(registerDto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── Login Tests ─────────────────────────────────────────────

  describe('login', () => {
    const loginDto = { email: 'test@test.com', password: 'password' };

    it('should successfully login and return a token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        user_id: 1,
        email: 'test@test.com',
        password_hash: 'hashed',
        deleted_at: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockJwt.sign).toHaveBeenCalled();
      expect(result).toEqual({ access_token: 'fake-jwt-token' });
    });

    it('should throw Unauthorized if user not found or deleted', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      mockPrisma.user.findUnique.mockResolvedValue({ deleted_at: new Date() });
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw Unauthorized if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        password_hash: 'hashed',
        deleted_at: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── Password Reset Request ──────────────────────────────────

  describe('requestPasswordReset', () => {
    it('should create a token and send an email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ user_id: 1 });

      const result = await service.requestPasswordReset('test@test.com');

      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 1,
            token: 'fake-hex-token',
          }),
        }),
      );
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@test.com',
        'fake-hex-token',
      );
      expect(result).toEqual({ message: 'Password reset email sent' });
    });

    it('should throw BadRequestException if user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.requestPasswordReset('missing@test.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Reset Password Execution ────────────────────────────────

  describe('resetPassword', () => {
    const validTokenRecord = {
      id: 1,
      user_id: 1,
      token: 'valid-token',
      used: false,
      expires_at: new Date(Date.now() + 100000),
    };

    it('should successfully reset the password', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(
        validTokenRecord,
      );

      const result = await service.resetPassword('valid-token', 'new-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { used: true },
      });
      expect(result).toEqual({ message: 'Password successfully reset' });
    });

    it('should throw BadRequest if token is invalid (null)', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'pass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if token is already used', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validTokenRecord,
        used: true,
      });
      await expect(service.resetPassword('used-token', 'pass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if token is expired', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validTokenRecord,
        expires_at: new Date(Date.now() - 10000),
      });
      await expect(
        service.resetPassword('expired-token', 'pass'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Get User Profile ────────────────────────────────────────

  describe('getUserProfile', () => {
    it('should return the user profile', async () => {
      const mockUser = { user_id: 1, username: 'test' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserProfile(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found in DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserProfile(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
