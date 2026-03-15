import { Test, TestingModule } from '@nestjs/testing';
import { LogsService } from './logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel } from '@prisma/client';

describe('LogsService', () => {
  let service: LogsService;
  let prisma: PrismaService;

  const mockPrisma = {
    log: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LogsService>(LogsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Create Log Tests ──────────────────────────────────────────

  describe('create', () => {
    it('should create a log entry with a userId', async () => {
      mockPrisma.log.create.mockResolvedValue({ id: 1 });

      await service.create(LogLevel.INFO, 'User logged in', 5);

      expect(mockPrisma.log.create).toHaveBeenCalledWith({
        data: { level: LogLevel.INFO, message: 'User logged in', user_id: 5 },
      });
    });

    it('should create a system log entry WITHOUT a userId (null fallback)', async () => {
      mockPrisma.log.create.mockResolvedValue({ id: 2 });

      await service.create(LogLevel.ERROR, 'Database connection failed');

      expect(mockPrisma.log.create).toHaveBeenCalledWith({
        data: {
          level: LogLevel.ERROR,
          message: 'Database connection failed',
          user_id: null,
        },
      });
    });
  });

  // ─── FindAll Log Tests ───

  describe('findAll', () => {
    it('should return logs with default pagination when NO options are provided', async () => {
      mockPrisma.log.findMany.mockResolvedValue([
        { id: 1, message: 'test log' },
      ]);
      mockPrisma.log.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(mockPrisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          skip: 0,
          where: {},
        }),
      );
      expect(mockPrisma.log.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        total: 1,
        limit: 100,
        offset: 0,
        logs: [{ id: 1, message: 'test log' }],
      });
    });

    it('should apply filters and custom pagination when options ARE provided', async () => {
      mockPrisma.log.findMany.mockResolvedValue([
        { id: 2, message: 'warn log' },
      ]);
      mockPrisma.log.count.mockResolvedValue(1);

      const opts = { level: LogLevel.WARN, userId: 10, limit: 50, offset: 25 };
      const result = await service.findAll(opts);

      const expectedWhere = { level: LogLevel.WARN, user_id: 10 };

      expect(mockPrisma.log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 25,
          where: expectedWhere,
        }),
      );
      expect(mockPrisma.log.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result).toEqual({
        total: 1,
        limit: 50,
        offset: 25,
        logs: [{ id: 2, message: 'warn log' }],
      });
    });
  });
});
