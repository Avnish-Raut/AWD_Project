import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel } from '@prisma/client';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Write a log entry. Call this from other services to record activity.
   * userId is optional (e.g. for system-level events).
   */
  async create(level: LogLevel, message: string, userId?: number) {
    return this.prisma.log.create({
      data: {
        level,
        message,
        user_id: userId ?? null,
      },
    });
  }

  /** R27: Admin – retrieve all logs with optional filters */
  async findAll(opts?: {
    level?: LogLevel;
    userId?: number;
    limit?: number;
    offset?: number;
  }) {
    const { level, userId, limit = 100, offset = 0 } = opts ?? {};

    const [logs, total] = await Promise.all([
      this.prisma.log.findMany({
        where: {
          ...(level ? { level } : {}),
          ...(userId ? { user_id: userId } : {}),
        },
        include: {
          user: {
            select: { user_id: true, username: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.log.count({
        where: {
          ...(level ? { level } : {}),
          ...(userId ? { user_id: userId } : {}),
        },
      }),
    ]);

    return { total, limit, offset, logs };
  }
}
