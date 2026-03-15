import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: { count: jest.fn() },
    event: { count: jest.fn() },
    registration: { count: jest.fn() },
    log: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminDashboardStats', () => {
    it('should aggregate counts from users, events, registrations, and logs', async () => {
      // Setup specific return values for each count call
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.event.count.mockResolvedValue(50);
      mockPrisma.registration.count.mockResolvedValue(200);
      mockPrisma.log.count.mockResolvedValue(5);

      const stats = await service.getAdminDashboardStats();

      // Verify the structure of the returned object
      expect(stats).toEqual({
        totalUsers: 100,
        totalEvents: 50,
        activeRegistrations: 200,
        systemAlerts: 5,
      });

      // Verify each call used the correct filters
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { deleted_at: null },
      });

      expect(prisma.registration.count).toHaveBeenCalledWith({
        where: { status: 'CONFIRMED' },
      });

      expect(prisma.log.count).toHaveBeenCalledWith({
        where: {
          level: { in: ['WARN', 'ERROR'] },
        },
      });
    });
  });
});
