import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Role } from '@prisma/client';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let service: StatisticsService;

  const mockStatisticsService = {
    getAdminDashboardStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        { provide: StatisticsService, useValue: mockStatisticsService },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
    service = module.get<StatisticsService>(StatisticsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminStats', () => {
    it('should call statisticsService.getAdminDashboardStats and return the result', async () => {
      const mockStats = {
        totalUsers: 10,
        totalEvents: 5,
        activeRegistrations: 15,
        systemAlerts: 1,
      };

      mockStatisticsService.getAdminDashboardStats.mockResolvedValue(mockStats);

      const result = await controller.getAdminStats();

      expect(service.getAdminDashboardStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStats);
    });
  });
});
