import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';

// Mock fs to prevent actual file deletion/creation during tests
jest.mock('fs');
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = { sub: 1, role: Role.USER };
  const mockAdmin = { sub: 99, role: Role.ADMIN };

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteAccount: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateRole: jest.fn(),
    deactivateUser: jest.fn(),
    reactivateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('Profile & Account Management', () => {
    it('should get own profile', async () => {
      await controller.getProfile(mockUser as any);
      expect(service.getProfile).toHaveBeenCalledWith(mockUser.sub);
    });

    it('should update own profile', async () => {
      const dto = { username: 'newname' };
      await controller.updateProfile(mockUser as any, dto);
      expect(service.updateProfile).toHaveBeenCalledWith(mockUser.sub, dto);
    });

    it('should delete own account', async () => {
      await controller.deleteAccount(mockUser as any);
      expect(service.deleteAccount).toHaveBeenCalledWith(mockUser.sub);
    });
  });
  describe('Avatar Management', () => {
    it('should throw BadRequest if no file is uploaded', async () => {
      await expect(
        controller.uploadAvatar(mockUser as any, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload avatar and delete old one if it exists', async () => {
      const mockFile = { filename: 'new-avatar.png' } as any;
      const oldAvatar = '/uploads/avatars/old.png';

      mockUsersService.getProfile.mockResolvedValue({ avatar_url: oldAvatar });
      (fs.existsSync as jest.Mock).mockReturnValue(true); // Simulate old file exists

      await controller.uploadAvatar(mockUser as any, mockFile);

      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(service.updateProfile).toHaveBeenCalledWith(mockUser.sub, {
        avatar_url: `/uploads/avatars/new-avatar.png`,
      });
    });

    it('should delete avatar and reset to default', async () => {
      const oldAvatar = '/uploads/avatars/something-unique.png';
      mockUsersService.getProfile.mockResolvedValue({ avatar_url: oldAvatar });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await controller.deleteAvatar(mockUser as any);

      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(service.updateProfile).toHaveBeenCalledWith(mockUser.sub, {
        avatar_url: '/uploads/avatars/default-avatar.png',
      });
    });
    it('should upload avatar successfully', async () => {
      const mockFile = {
        filename: 'test-avatar.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File; // Cast to the real type

      mockUsersService.getProfile.mockResolvedValue({ avatar_url: null });

      await controller.uploadAvatar(mockUser as any, mockFile);

      expect(service.updateProfile).toHaveBeenCalledWith(
        mockUser.sub,
        expect.objectContaining({
          avatar_url: expect.stringContaining('test-avatar.jpg'),
        }),
      );
    });
  });

  describe('Admin Operations', () => {
    it('should findAll with optional search', async () => {
      await controller.findAll('search-term');
      expect(service.findAll).toHaveBeenCalledWith('search-term');
    });

    it('should findOne user by ID', async () => {
      await controller.findOne(5);
      expect(service.findOne).toHaveBeenCalledWith(5);
    });

    it('should update user role', async () => {
      const dto = { role: Role.ORG };
      await controller.updateRole(5, dto);
      expect(service.updateRole).toHaveBeenCalledWith(5, Role.ORG);
    });

    it('should deactivate user', async () => {
      await controller.deactivateUser(5);
      expect(service.deactivateUser).toHaveBeenCalledWith(5);
    });

    it('should reactivate user', async () => {
      await controller.reactivateUser(5);
      expect(service.reactivateUser).toHaveBeenCalledWith(5);
    });
  });
});
