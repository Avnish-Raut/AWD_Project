import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: PrismaService;

  const mockPrisma = {
    event: { findUnique: jest.fn() },
    report: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();

    // Bypass the 1.5 second artificial delay so tests run instantly
    jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
      cb();
      return 0 as any;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── R18: Create Report Tests ──────────────────────────────────

  describe('createReport', () => {
    const eventId = 1;
    const organizerId = 10;

    it('should successfully create a report and trigger processing', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: eventId,
        organizer_id: organizerId,
      });
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.create.mockResolvedValue({ report_id: 99 });

      // Spy on the private method to prevent it from executing during THIS test
      const processSpy = jest
        .spyOn(service as any, 'processReport')
        .mockImplementation(async () => {});

      const result = await service.createReport(eventId, organizerId);

      expect(mockPrisma.report.create).toHaveBeenCalledWith({
        data: {
          event_id: eventId,
          organizer_id: organizerId,
          status: ReportStatus.PENDING,
          progress_percent: 0,
        },
      });
      expect(processSpy).toHaveBeenCalledWith(99);
      expect(result).toEqual({ report_id: 99 });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      await expect(service.createReport(eventId, organizerId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: eventId,
        organizer_id: 999,
      }); // Wrong organizer
      await expect(service.createReport(eventId, organizerId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if report is already in progress', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: eventId,
        organizer_id: organizerId,
      });
      mockPrisma.report.findFirst.mockResolvedValue({
        report_id: 99,
        status: 'IN_PROGRESS',
      });

      await expect(service.createReport(eventId, organizerId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── R19: Process Report (Private Method) ───────────────────────

  describe('processReport (private)', () => {
    it('should calculate analytics and update report to DONE', async () => {
      const mockReportData = {
        report_id: 1,
        event: {
          capacity: 10,
          registrations: [
            { status: 'CONFIRMED' },
            { status: 'CONFIRMED' },
            { status: 'CONFIRMED' },
            { status: 'CANCELLED' },
            { status: 'PENDING' },
          ],
        },
      };
      mockPrisma.report.findUnique.mockResolvedValue(mockReportData);

      // Cast to 'any' to test the private method directly
      await (service as any).processReport(1);

      // Verify the 10 loops executed and updated progress
      expect(mockPrisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { progress_percent: 100 } }),
      );

      // Verify final calculation
      // 5 total, 3 confirmed, 1 cancelled, capacity 10 -> (3/10) * 100 = 30% occupancy
      expect(mockPrisma.report.update).toHaveBeenLastCalledWith({
        where: { report_id: 1 },
        data: {
          status: ReportStatus.DONE,
          result_data: {
            total_registrations: 5,
            confirmed_registrations: 3,
            cancelled_registrations: 1,
            capacity: 10,
            occupancy_rate_percent: 30,
          },
        },
      });
    });

    it('should handle capacity of 0 properly without dividing by zero', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        report_id: 1,
        event: { capacity: 0, registrations: [{ status: 'CONFIRMED' }] },
      });

      await (service as any).processReport(1);

      // If capacity is 0, occupancy rate should be 0
      expect(mockPrisma.report.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            result_data: expect.objectContaining({ occupancy_rate_percent: 0 }),
          }),
        }),
      );
    });

    it('should return early if report is not found during processing', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);
      await (service as any).processReport(1);
      // It shouldn't crash, and it shouldn't update to DONE
      const doneUpdates = mockPrisma.report.update.mock.calls.filter(
        (call) => call[0].data.status === ReportStatus.DONE,
      );
      expect(doneUpdates.length).toBe(0);
    });
  });

  // ─── R35 + R36: Get Report ─────────────────────────────────────

  describe('getReport', () => {
    it('should allow an ADMIN to view any report', async () => {
      const mockReport = { report_id: 1, organizer_id: 99 };
      mockPrisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.getReport(1, { sub: 10, role: 'ADMIN' });
      expect(result).toEqual(mockReport);
    });

    it('should allow the ORGANIZER to view their own report', async () => {
      const mockReport = { report_id: 1, organizer_id: 10 };
      mockPrisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.getReport(1, { sub: 10, role: 'USER' });
      expect(result).toEqual(mockReport);
    });

    it('should throw ForbiddenException if user is neither admin nor the organizer', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        report_id: 1,
        organizer_id: 99,
      }); // Organizer is 99
      await expect(
        service.getReport(1, { sub: 10, role: 'USER' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if report is not found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);
      await expect(
        service.getReport(1, { sub: 10, role: 'ADMIN' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── R37: Get All Reports ──────────────────────────────────────

  describe('getAllReports', () => {
    it('should return a list of all reports with events included', async () => {
      mockPrisma.report.findMany.mockResolvedValue([{ report_id: 1 }]);

      const result = await service.getAllReports();

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith({
        include: { event: true },
      });
      expect(result).toEqual([{ report_id: 1 }]);
    });
  });
});
