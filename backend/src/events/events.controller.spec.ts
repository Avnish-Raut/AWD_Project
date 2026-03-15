import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Role } from '@prisma/client';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEventsService = {
    findAllForAdmin: jest.fn(),
    findAllPublished: jest.fn(),
    findMyEvents: jest.fn(),
    findUserEvents: jest.fn(),
    findOne: jest.fn(),
    addDocument: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    getParticipants: jest.fn(),
    registerParticipant: jest.fn(),
    cancelRegistration: jest.fn(),
    cancel: jest.fn(),
  };

  const mockUser = { sub: 1, role: Role.ORG, email: 'test@test.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllForAdmin', () => {
    it('should parse skip and take strings to numbers', async () => {
      await controller.findAllForAdmin('test', '10', '5');
      expect(service.findAllForAdmin).toHaveBeenCalledWith('test', 10, 5);
    });

    it('should handle undefined skip and take', async () => {
      await controller.findAllForAdmin('test', undefined, undefined);
      expect(service.findAllForAdmin).toHaveBeenCalledWith(
        'test',
        undefined,
        undefined,
      );
    });
  });

  describe('findAll', () => {
    it('should pass filters to service', async () => {
      const filters = {
        search: 'a',
        location: 'b',
        dateFrom: 'c',
        dateTo: 'd',
      };
      await controller.findAll('a', 'b', 'c', 'd');
      expect(service.findAllPublished).toHaveBeenCalledWith(filters);
    });
  });

  describe('findMyEvents & findUserEvents', () => {
    it('should call findMyEvents with user sub', async () => {
      await controller.findMyEvents(mockUser);
      expect(service.findMyEvents).toHaveBeenCalledWith(1);
    });

    it('should call findUserEvents with user sub', async () => {
      await controller.findUserEvents({ ...mockUser, role: Role.USER });
      expect(service.findUserEvents).toHaveBeenCalledWith(1);
    });
  });

  describe('File Upload', () => {
    it('should call addDocument with file and user sub', async () => {
      const mockFile = { originalname: 'test.pdf' } as Express.Multer.File;
      await controller.uploadFile(123, mockFile, mockUser);
      expect(service.addDocument).toHaveBeenCalledWith(123, 1, mockFile);
    });
  });

  describe('Standard Actions (Create, Update, Publish)', () => {
    it('should create an event', async () => {
      const dto = { title: 'New' } as any;
      await controller.create(dto, mockUser);
      expect(service.create).toHaveBeenCalledWith(dto, 1);
    });

    it('should update an event', async () => {
      const dto = { title: 'Updated' } as any;
      await controller.update(123, dto, mockUser);
      expect(service.update).toHaveBeenCalledWith(123, dto, 1);
    });

    it('should publish an event', async () => {
      await controller.publish(123, mockUser);
      expect(service.publish).toHaveBeenCalledWith(123, 1);
    });
  });

  describe('Registration and Participants', () => {
    it('should get participants', async () => {
      await controller.getParticipants(123, mockUser);
      expect(service.getParticipants).toHaveBeenCalledWith(123, 1);
    });

    it('should register for an event', async () => {
      await controller.registerForEvent(123, mockUser);
      expect(service.registerParticipant).toHaveBeenCalledWith(123, 1);
    });

    it('should cancel registration', async () => {
      await controller.cancelRegistration(123, mockUser);
      expect(service.cancelRegistration).toHaveBeenCalledWith(123, 1);
    });
  });

  describe('cancelEvent', () => {
    it('should pass id, sub, and role to service', async () => {
      await controller.cancelEvent(123, mockUser);
      expect(service.cancel).toHaveBeenCalledWith(123, 1, Role.ORG);
    });
  });
});
