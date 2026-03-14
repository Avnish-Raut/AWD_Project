import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Role } from '@prisma/client';
import { mock } from 'node:test';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockUser = { sub: 1, role: Role.USER };
  const mockOrg = { sub: 10, role: Role.ORG };

  const mockEventsService = {
    findAllPublished: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ event_id: 1 }),
    create: jest.fn().mockResolvedValue({ event_id: 1 }),
    findMyEvents: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ event_id: 1 }),
    publish: jest.fn().mockResolvedValue({ event_id: 1 }),
    getParticipants: jest.fn().mockResolvedValue([]),
    registerParticipant: jest.fn().mockResolvedValue({ status: 'CONFIRMED' }),
    cancelRegistration: jest.fn().mockResolvedValue({ status: 'CANCELLED' }),
    findUserEvents: jest.fn().mockResolvedValue([]),
    cancel: jest.fn().mockResolvedValue({ is_cancelled: true }),
  };

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

  it('should call findAllPublished via findAll', async () => {
    await controller.findAll('search', 'loc', 'from', 'to');
    expect(service.findAllPublished).toHaveBeenCalled();
  });

  it('should call findAllPublished with all query parameters', async () => {
    const query = {
      search: 'concert',
      location: 'Berlin',
      date_from: '2026-01-01',
      date_to: '2026-01-02',
    };

    await controller.findAll(
      query.search,
      query.location,
      query.date_from,
      query.date_to,
    );

    expect(service.findAllPublished).toHaveBeenCalledWith({
      search: 'concert',
      location: 'Berlin',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-02',
    });
  });
  it('should call findAllPublished with NO parameters (undefined branch)', async () => {
    await controller.findAll(undefined, undefined, undefined, undefined);
    expect(service.findAllPublished).toHaveBeenCalledWith({
      search: undefined,
      location: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  });
  it('should call findOne', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should call findMyEvents (Organizer)', async () => {
    await controller.findMyEvents(mockOrg as any);
    expect(service.findMyEvents).toHaveBeenCalledWith(mockOrg.sub);
  });

  it('should call findUserEvents (User)', async () => {
    await controller.findUserEvents(mockUser as any);
    expect(service.findUserEvents).toHaveBeenCalledWith(mockUser.sub);
  });
  it('should call getParticipants', async () => {
    await controller.getParticipants(1, mockOrg as any);
    expect(service.getParticipants).toHaveBeenCalledWith(1, mockOrg.sub);
  });

  it('should call create (Organizer)', async () => {
    const dto = { title: 'Test' } as any;
    await controller.create(dto, mockOrg as any);
    expect(service.create).toHaveBeenCalledWith(dto, mockOrg.sub);
  });

  it('should call update (Organizer)', async () => {
    const dto = { title: 'Updated' } as any;
    await controller.update(1, dto, mockOrg as any);
    expect(service.update).toHaveBeenCalledWith(1, dto, mockOrg.sub);
  });

  it('should call publish (Organizer)', async () => {
    await controller.publish(1, mockOrg as any);
    expect(service.publish).toHaveBeenCalledWith(1, mockOrg.sub);
  });

  it('should call registerForEvent (Participant)', async () => {
    await controller.registerForEvent(1, mockUser as any);
    expect(service.registerParticipant).toHaveBeenCalledWith(1, mockUser.sub);
  });

  it('should call cancelRegistration (Participant)', async () => {
    await controller.cancelRegistration(1, mockUser as any);
    expect(service.cancelRegistration).toHaveBeenCalledWith(1, mockUser.sub);
  });

  it('should call cancelEvent (Admin/Org)', async () => {
    await controller.cancelEvent(1, mockOrg as any);
    expect(service.cancel).toHaveBeenCalledWith(1, mockOrg.sub, mockOrg.role);
  });
});
