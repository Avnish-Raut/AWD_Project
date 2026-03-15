import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './reports.controller';
import { ReportService } from './reports.service'; // Make sure this matches your exact import path

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;

  // Mock the service methods
  const mockReportService = {
    createReport: jest.fn(),
    getReport: jest.fn(),
    getAllReports: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: mockReportService }],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── R18: Generate Event Report ────────────────────────────────

  describe('create', () => {
    it('should parse the string ID to a number and pass req.user.sub to the service', async () => {
      // Mock the request object injected by JwtAuthGuard
      const mockReq = { user: { sub: 42 } };
      const expectedResponse = { report_id: 1, status: 'PENDING' };

      mockReportService.createReport.mockResolvedValue(expectedResponse);

      // Pass '5' as a string, just like an HTTP URL param would
      const result = await controller.create('5', mockReq);

      // Verify the '+' operator correctly turned '5' into the number 5
      expect(service.createReport).toHaveBeenCalledWith(5, 42);
      expect(result).toEqual(expectedResponse);
    });
  });

  // ─── R18: View Report Status ───────────────────────────────────

  describe('get', () => {
    it('should parse the string ID to a number and pass the full user object to the service', async () => {
      const mockReq = { user: { sub: 42, role: 'ORG' } };
      const expectedResponse = { report_id: 5, status: 'DONE' };

      mockReportService.getReport.mockResolvedValue(expectedResponse);

      const result = await controller.get('5', mockReq);

      expect(service.getReport).toHaveBeenCalledWith(5, mockReq.user);
      expect(result).toEqual(expectedResponse);
    });
  });

  // ─── Admin: View All Reports ───────────────────────────────────

  describe('getAll', () => {
    it('should call getAllReports on the service and return the list', async () => {
      const expectedReports = [{ report_id: 1 }, { report_id: 2 }];
      mockReportService.getAllReports.mockResolvedValue(expectedReports);

      const result = await controller.getAll();

      expect(service.getAllReports).toHaveBeenCalled();
      expect(result).toEqual(expectedReports);
    });
  });
});
