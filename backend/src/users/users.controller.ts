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
} from '@nestjs/common';
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

  // R23 — Delete own account
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@GetUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }

  // ─── Admin endpoints (ADMIN role only) ─────────────────────────────

  // R25 — List all users
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
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
