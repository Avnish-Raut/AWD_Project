import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboardStats() {
    const totalUsers = await this.prisma.user.count({
      where: { deleted_at: null },
    });
    
    const totalEvents = await this.prisma.event.count();
    
    const activeRegistrations = await this.prisma.registration.count({
      where: { status: 'CONFIRMED' },
    });
    
    const systemAlerts = await this.prisma.log.count({
      where: { 
        level: { 
          in: ['WARN', 'ERROR'] 
        } 
      },
    });

    return {
      totalUsers,
      totalEvents,
      activeRegistrations,
      systemAlerts,
    };
  }
}
