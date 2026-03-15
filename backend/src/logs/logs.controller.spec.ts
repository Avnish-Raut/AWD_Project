import { Test, TestingModule } from '@nestjs/testing';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { LogLevel } from '@prisma/client';

describe('LogsController', () => {
  let controller: LogsController;
  let logsService: LogsService;

  const mockLogsService = {
    findAll: jest.fn().mockResolvedValue({
      total: 1,
      limit: 100,
      offset: 0,
      logs: [{ id: 1, message: 'Test log' }],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [{ provide: LogsService, useValue: mockLogsService }],
    }).compile();

    controller = module.get<LogsController>(LogsController);
    logsService = module.get<LogsService>(LogsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call LogsService with default values when no queries are provided', async () => {
      // 1. Call with all undefined parameters
      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
      );

      // 2. Verify the fallbacks (100 and 0) were used
      expect(logsService.findAll).toHaveBeenCalledWith({
        level: undefined,
        userId: undefined,
        limit: 100,
        offset: 0,
      });

      expect(result).toBeDefined();
    });

    it('should parse string query parameters into numbers', async () => {
      // 1. Call with string representations of numbers, just like an HTTP request would
      await controller.findAll(LogLevel.ERROR, '5', '50', '10');

      // 2. Verify parseInt successfully converted them
      expect(logsService.findAll).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        userId: 5,
        limit: 50,
        offset: 10,
      });
    });

    it('should handle partial query parameters correctly', async () => {
      // 1. Provide only level and userId, leaving limit and offset empty
      await controller.findAll(LogLevel.WARN, '42', undefined, undefined);

      // 2. Verify it parsed the userId but fell back to defaults for limit/offset
      expect(logsService.findAll).toHaveBeenCalledWith({
        level: LogLevel.WARN,
        userId: 42,
        limit: 100,
        offset: 0,
      });
    });
  });
});
