import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportStatus } from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    event: { findUnique: jest.fn() },
    report: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── R18: Create Report ────────────────────────────────────────

  describe('createReport', () => {
    it('should throw NotFound if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      await expect(service.createReport(1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw Forbidden if user is not the organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ organizer_id: 99 });
      await expect(service.createReport(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequest if a report is already in progress', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ organizer_id: 10 });
      mockPrisma.report.findFirst.mockResolvedValue({ report_id: 5 });
      await expect(service.createReport(1, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a report and trigger async processing', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: 1,
        organizer_id: 10,
      });
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.create.mockResolvedValue({ report_id: 100 });

      const result = await service.createReport(1, 10);

      expect(prisma.report.create).toHaveBeenCalled();
      expect(result.report_id).toBe(100);
    });
  });

  // ─── R19: Async Processing Logic ───────────────────────────────

  describe('processReport (Private Logic)', () => {
    beforeEach(() => {
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return {} as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should run the progress loop and calculate analytics', async () => {
      const mockReportData = {
        report_id: 100,
        event: {
          capacity: 100,
          registrations: [
            { status: 'CONFIRMED' },
            { status: 'CONFIRMED' },
            { status: 'CANCELLED' },
          ],
        },
      };

      mockPrisma.report.update.mockResolvedValue({});
      mockPrisma.report.findUnique.mockResolvedValue(mockReportData);

      await (service as any).processReport(100);

      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { report_id: 100 },
          data: expect.objectContaining({ status: ReportStatus.DONE }),
        }),
      );

      const lastCall = (prisma.report.update as jest.Mock).mock.calls.find(
        (call) => call[0].data.status === ReportStatus.DONE,
      );
      expect(lastCall[0].data.result_data.occupancy_rate_percent).toBe(2);
    }, 10000);

    it('should handle zero capacity to avoid division by zero', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        event: { capacity: 0, registrations: [] },
      });
      mockPrisma.report.update.mockResolvedValue({});

      await (service as any).processReport(100);

      const lastCall = (prisma.report.update as jest.Mock).mock.calls.find(
        (call) => call[0].data.status === ReportStatus.DONE,
      );
      expect(lastCall[0].data.result_data.occupancy_rate_percent).toBe(0);
    });
  });
  // ─── R35/R36: Access Control ───────────────────────────────────

  describe('getReport', () => {
    it('should allow Admin to see any report', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ organizer_id: 50 });
      const result = await service.getReport(1, { sub: 1, role: 'ADMIN' });
      expect(result).toBeDefined();
    });

    it('should throw Forbidden if normal user tries to see someone elses report', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ organizer_id: 50 });
      await expect(
        service.getReport(1, { sub: 1, role: 'USER' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
