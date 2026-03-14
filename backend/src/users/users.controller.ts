import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ─── Self-service (any authenticated user) ────────────────────────────────

  // R29 — View own profile
  @Get('me')
  getProfile(@GetUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  // R34 — Update own profile
  @Patch('me')
  updateProfile(
    @GetUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  // R37 - Upload Avatar
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads/avatars';
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(
    @GetUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const currentUser = await this.usersService.getProfile(user.sub);
    
    if (currentUser.avatar_url) {
      const oldFilePath = path.join(process.cwd(), currentUser.avatar_url);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          console.error(`Failed to delete old avatar file: ${oldFilePath}`, e);
        }
      }
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateProfile(user.sub, { avatar_url: avatarUrl });
  }

  // R37 - Delete Avatar (Remove entirely)
  @Delete('me/avatar')
  async deleteAvatar(@GetUser() user: JwtPayload) {
    const currentUser = await this.usersService.getProfile(user.sub);
    
    if (currentUser.avatar_url) {
      const oldFilePath = path.join(process.cwd(), currentUser.avatar_url);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          console.error(`Failed to delete old avatar file: ${oldFilePath}`, e);
        }
      }
    }

    // Pass null or empty string to clear the avatar in the DB
    // Assuming updateProfile allows clearing if we update the service
    return this.usersService.updateProfile(user.sub, { avatar_url: null } as any);
  }

  // R23 — Delete own account
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@GetUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }

  // ─── Admin endpoints (ADMIN role only) ─────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipVal = skip ? parseInt(skip, 10) : undefined;
    const takeVal = take ? parseInt(take, 10) : undefined;
    return this.usersService.findAll(search, skipVal, takeVal);
  }

  // R25 — Get user by ID
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // R25 — Update user role
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, dto.role);
  }

  // R25 — Deactivate user (soft-delete)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivateUser(id);
  }

  // R25 — Reactivate user
  @Post(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  reactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.reactivateUser(id);
  }
}
