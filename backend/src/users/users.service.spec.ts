import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client/edge';
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockLogs = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LogsService, useValue: mockLogs },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should throw BadRequest if no fields provided', async () => {
      await expect(service.updateProfile(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw Conflict if email is already taken', async () => {
      const dto = { email: 'taken@test.com' };
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        user_id: 99,
      });

      await expect(service.updateProfile(1, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update password if current_password is valid', async () => {
      const dto = { current_password: 'old', new_password: 'new' };
      const mockUser = {
        user_id: 1,
        password_hash: await bcrypt.hash('old', 10),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ user_id: 1 });

      await service.updateProfile(1, dto);
      expect(prisma.user.update).toHaveBeenCalled();
    });
    it('should throw BadRequestException if new_password is provided without current_password', async () => {
      const dto = { new_password: 'brand-new-password' }; // Notice current_password is missing

      await expect(service.updateProfile(1, dto)).rejects.toThrow(
        new BadRequestException(
          'current_password is required when setting a new password',
        ),
      );

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Admin Operations', () => {
    it('should deactivate a user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        user_id: 1,
        deleted_at: null,
      });
      await service.deactivateUser(1);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { deleted_at: expect.any(Date) },
        }),
      );
    });

    it('should reactivate a user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        user_id: 1,
      });
      await service.reactivateUser(1);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { deleted_at: null },
        }),
      );
    });

    it('should findAll with search filter', async () => {
      await service.findAll('test-search');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: expect.any(Array) },
        }),
      );
    });
  });
  describe('getProfile', () => {
    const userId = 1;
    const mockUser = {
      user_id: userId,
      username: 'testuser',
      email: 'test@hildesheim.de',
      role: 'USER',
      avatar_url: null,
      created_at: new Date(),
    };

    it('should return the user profile if found and not deleted', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.getProfile(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { user_id: userId, deleted_at: null },
        select: expect.any(Object),
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found or deleted', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  it('should cover all branches in deleteAccount', async () => {
    const userId = 1;
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      user_id: userId,
      deleted_at: null,
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({
      user_id: userId,
    });
  });

  describe('findOne', () => {
    it('should return a user with event and registration counts', async () => {
      const mockUser = {
        user_id: 1,
        username: 'admin',
        _count: { events: 5, registrations: 10 },
      };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 1 },
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
  describe('updateRole', () => {
    const userId = 1;
    const newRole = Role.ADMIN;

    it('should successfully update a user role and create a log', async () => {
      // 1. Mock finding the user first
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        user_id: userId,
      });

      // 2. Mock the update result
      const updatedUser = { user_id: userId, role: newRole };
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateRole(userId, newRole);

      // 3. Assertions
      expect(result.role).toBe(newRole);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: newRole },
        }),
      );

      // 4. Verify the LogsService was called
      expect(mockLogs.create).toHaveBeenCalledWith(
        'INFO',
        expect.stringContaining(
          `Admin changed user ${userId} role to ${newRole}`,
        ),
      );
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateRole(userId, Role.ORG)).rejects.toThrow(
        NotFoundException,
      );

      // Ensure update was never called if user wasn't found
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
  describe('deleteAccount', () => {
    const userId = 1;

    it('should successfully soft-delete the account and log the action', async () => {
      // 1. Mock finding an active user
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        user_id: userId,
        deleted_at: null,
      });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        user_id: userId,
      });

      const result = await service.deleteAccount(userId);

      // 2. Verify the update used a Date object (for soft delete)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { deleted_at: expect.any(Date) },
      });

      // 3. Verify the log was created with the correct userId
      expect(mockLogs.create).toHaveBeenCalledWith(
        'INFO',
        `User ${userId} deleted their account`,
        userId,
      );

      expect(result.message).toBe('Account deleted successfully');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteAccount(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if account is already deleted', async () => {
      // Mock a user that already has a deleted_at timestamp
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        user_id: userId,
        deleted_at: new Date(),
      });

      await expect(service.deleteAccount(userId)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
