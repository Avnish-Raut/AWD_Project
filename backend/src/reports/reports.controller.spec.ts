import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './reports.controller';
import { ReportService } from './reports.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { of } from 'rxjs';

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;
  let eventEmitter: EventEmitter2;

  const mockReportService = {
    createReport: jest.fn(),
    getReport: jest.fn(),
    getAllReports: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };

  const mockReq = {
    user: { sub: 10, role: 'ORG' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: ReportService, useValue: mockReportService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.createReport with numeric id', async () => {
      await controller.create('123', mockReq);
      expect(service.createReport).toHaveBeenCalledWith(123, 10);
    });
  });

  describe('get', () => {
    it('should call service.getReport with user object', async () => {
      await controller.get('456', mockReq);
      expect(service.getReport).toHaveBeenCalledWith(456, mockReq.user);
    });
  });

  describe('getAll', () => {
    it('should call service.getAllReports', async () => {
      await controller.getAll();
      expect(service.getAllReports).toHaveBeenCalled();
    });
  });

  describe('streamProgress (SSE)', () => {
    it('should return an observable that maps events to MessageEvent', (done) => {
      const reportId = '100';
      const mockPayload = { progress: 50, status: 'IN_PROGRESS' };

      // Mock fromEvent behavior:
      // We simulate the event emitter firing by manually triggering the observer
      jest.spyOn(require('rxjs'), 'fromEvent').mockReturnValue(of(mockPayload));

      const stream = controller.streamProgress(reportId);

      stream.subscribe({
        next: (event) => {
          expect(event).toEqual({ data: mockPayload });
          done();
        },
      });
    });
  });
});
