import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;

  // Mock ConfigService to return a dummy DATABASE_URL
  const mockConfigService = {
    get: jest.fn().mockReturnValue('postgresql://user:pass@localhost:5432/db'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call $connect', async () => {
      // Spy on the $connect method of the PrismaClient (which service extends)
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockImplementation(async () => {});

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect', async () => {
      // Spy on the $disconnect method
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockImplementation(async () => {});

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});
