import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role, LogLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logs: LogsService,
  ) {}

  // R29 — Get own profile
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId, deleted_at: null },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        created_at: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // R34 — Update own profile (username, email, password)
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // Validate that we have at least one field to update
    const hasUpdate =
      dto.username !== undefined ||
      dto.email !== undefined ||
      dto.new_password !== undefined ||
      dto.avatar_url !== undefined;
    if (!hasUpdate)
      throw new BadRequestException('No fields provided for update');

    // If changing password, require current_password
    if (dto.new_password !== undefined) {
      if (!dto.current_password)
        throw new BadRequestException(
          'current_password is required when setting a new password',
        );

      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
      });
      if (!user) throw new NotFoundException('User not found');

      const valid = await bcrypt.compare(dto.current_password, user.password_hash);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
    }

    // If changing email, ensure it is not already taken
    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { user_id: userId } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    const data: Record<string, unknown> = {};
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.avatar_url !== undefined) data.avatar_url = dto.avatar_url;
    if (dto.new_password !== undefined)
      data.password_hash = await bcrypt.hash(dto.new_password, 10);

    return this.prisma.user.update({
      where: { user_id: userId },
      data,
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        created_at: true,
      },
    });
  }

  // ─── R23: Delete own account (soft delete) ────────────────────────────────

  async deleteAccount(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.deleted_at) throw new ConflictException('Account already deleted');

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { deleted_at: new Date() },
    });

    await this.logs.create(LogLevel.INFO, `User ${userId} deleted their account`, userId);
    return { message: 'Account deleted successfully' };
  }

  // ─── R25: Admin – list all users ──────────────────────────────────────────

  async findAll(search?: string) {
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        created_at: true,
        deleted_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── R25: Admin – get single user ─────────────────────────────────────────

  async findOne(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        deleted_at: true,
        _count: { select: { events: true, registrations: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── R25: Admin – update user role ────────────────────────────────────────

  async updateRole(userId: number, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { user_id: userId },
      data: { role },
      select: { user_id: true, username: true, email: true, role: true },
    });

    await this.logs.create(LogLevel.INFO, `Admin changed user ${userId} role to ${role}`);
    return updated;
  }

  // ─── R25: Admin – deactivate user ─────────────────────────────────────────

  async deactivateUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.deleted_at) throw new ConflictException('User already deactivated');

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { deleted_at: new Date() },
    });

    await this.logs.create(LogLevel.WARN, `Admin deactivated user ${userId}`);
    return { message: 'User deactivated successfully' };
  }

  // ─── R25: Admin – reactivate user ─────────────────────────────────────────

  async reactivateUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { deleted_at: null },
    });

    await this.logs.create(LogLevel.INFO, `Admin reactivated user ${userId}`);
    return { message: 'User reactivated successfully' };
  }
}
