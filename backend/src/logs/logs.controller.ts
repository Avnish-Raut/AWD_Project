import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LogLevel, Role } from '@prisma/client';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class LogsController {
  constructor(private logsService: LogsService) {}

  /**
   * R27: GET /api/logs
   * Admin-only. Supports ?level=INFO|WARN|ERROR, ?userId=N, ?limit=N, ?offset=N
   */
  @Get()
  findAll(
    @Query('level') level?: LogLevel,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.logsService.findAll({
      level,
      userId: userId ? parseInt(userId, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }
}
