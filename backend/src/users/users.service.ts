import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // R29 — Get own profile
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId, deleted_at: null },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
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
      dto.new_password !== undefined;
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
        created_at: true,
      },
    });
  }
}
