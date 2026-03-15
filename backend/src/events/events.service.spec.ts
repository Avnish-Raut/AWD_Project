import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllPublished', () => {
    it('should return published events', async () => {
      const mockEvents = [
        { event_id: 1, title: 'Hildesheim Tech Night', is_published: true },
      ];
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.findAllPublished();

      expect(result).toEqual(mockEvents);
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_published: true }),
        }),
      );
    });
    it('should cover all filter branches in findAllPublished', async () => {
      await service.findAllPublished({
        search: 'test',
        location: 'Hildesheim',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      });
      expect(prisma.event.findMany).toHaveBeenCalled();
    });
  });

  describe('findUserEvents', () => {
    it('should return events a user is registered for', async () => {
      const userId = 123;
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await service.findUserEvents(userId);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            registrations: {
              some: { user_id: userId, status: 'CONFIRMED' },
            },
          },
        }),
      );
    });
  });

  describe('findMyEvents', () => {
    it('should return events a user is registered for', async () => {
      const organizerId = 123;
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

      await service.findMyEvents(organizerId);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizer_id: organizerId,
          },
        }),
      );
    });
  });
  describe('findOne', () => {
    it('should return an event if found', async () => {
      const mockEvent = { event_id: 1, title: 'Test Event', organizer_id: 10 };
      (mockPrismaService.event.findUnique as jest.Mock).mockResolvedValue(
        mockEvent,
      );

      const result = await service.findOne(1);

      expect(result).toEqual(mockEvent);
      expect(prisma.event.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { event_id: 1 },
        }),
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      (mockPrismaService.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = 10;
    const eventId = 1;
    const updateDto = { title: 'Updated Title' };

    it('should update the event successfully if user is the organizer', async () => {
      const existingEvent = {
        event_id: eventId,
        organizer_id: userId,
        is_cancelled: false,
      };

      // Mock findOne (which is called inside update)
      jest.spyOn(service, 'findOne').mockResolvedValue(existingEvent as any);
      (mockPrismaService.event.update as jest.Mock).mockResolvedValue({
        ...existingEvent,
        ...updateDto,
      });

      const result = await service.update(eventId, updateDto, userId);

      expect(result.title).toBe('Updated Title');
      expect(prisma.event.update).toHaveBeenCalled();
    });
    it('should cover all update branches', async () => {
      const fullDto = {
        title: 'New Title',
        description: 'New Desc',
        event_date: '2026-01-01',
        location: 'Campus',
        capacity: 100,
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ organizer_id: 1, is_cancelled: false } as any);

      await service.update(1, fullDto, 1);
      expect(prisma.event.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the organizer', async () => {
      const existingEvent = {
        event_id: eventId,
        organizer_id: 999,
        is_cancelled: false,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(existingEvent as any);

      await expect(service.update(eventId, updateDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if the event is cancelled', async () => {
      const existingEvent = {
        event_id: eventId,
        organizer_id: userId,
        is_cancelled: true,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(existingEvent as any);

      await expect(service.update(eventId, updateDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create', () => {
    it('should successfully create an event', async () => {
      const dto = {
        title: 'Workshop',
        description: 'Learn NestJS',
        event_date: '2026-05-01',
        location: 'Building A',
        capacity: 50,
      };
      const organizerId = 1;

      (prisma.event.create as jest.Mock).mockResolvedValue({
        event_id: 1,
        ...dto,
      });

      const result = await service.create(dto, organizerId);

      expect(result.event_id).toBe(1);
      expect(prisma.event.create).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    const userId = 10;
    const eventId = 1;

    it('should successfully publish the event', async () => {
      const mockEvent = {
        event_id: eventId,
        organizer_id: userId,
        is_cancelled: false,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvent as any);
      (mockPrismaService.event.update as jest.Mock).mockResolvedValue({
        ...mockEvent,
        is_published: true,
      });

      await service.publish(eventId, userId);
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { event_id: eventId },
        data: { is_published: true },
      });
    });

    it('should throw ForbiddenException if not the owner', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ organizer_id: 999 } as any);
      await expect(service.publish(eventId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if event is already cancelled', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ organizer_id: userId, is_cancelled: true } as any);
      await expect(service.publish(eventId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    const userId = 10;
    const eventId = 5;

    it('should allow an ADMIN to cancel any event', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ organizer_id: 999, is_cancelled: false } as any);

      await service.cancel(eventId, userId, 'ADMIN');
      expect(prisma.event.update).toHaveBeenCalled();
    });

    it('should allow the OWNER to cancel their own event', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        organizer_id: userId,
        is_cancelled: false,
      } as any);

      await service.cancel(eventId, userId, 'USER');
      expect(prisma.event.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is neither Admin nor Owner', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ organizer_id: 999, is_cancelled: false } as any);

      await expect(service.cancel(eventId, userId, 'USER')).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('should throw BadRequestException if event is already cancelled', async () => {
      const userId = 10;
      const eventId = 5;

      // 1. Mock findOne to return an event where is_cancelled is true
      jest.spyOn(service, 'findOne').mockResolvedValue({
        organizer_id: userId,
        is_cancelled: true,
      } as any);

      // 2. Assert that the service throws the specific exception
      await expect(service.cancel(eventId, userId, 'USER')).rejects.toThrow(
        new BadRequestException('Event is already cancelled'),
      );

      // 3. Verify that update was NEVER called because the error happened first
      expect(prisma.event.update).not.toHaveBeenCalled();
    });
  });

  describe('getParticipants', () => {
    it('should return the participant list for the organizer', async () => {
      const userId = 1;
      const eventId = 100;
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ organizer_id: userId } as any);

      const mockRegistrations = [{ user: { username: 'student1' } }];
      (mockPrismaService.registration.findMany as jest.Mock).mockResolvedValue(
        mockRegistrations,
      );

      const result = await service.getParticipants(eventId, userId);

      expect(result).toEqual(mockRegistrations);
      expect(prisma.registration.findMany).toHaveBeenCalled();
    });

    it('should block non-organizers from seeing the list', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ organizer_id: 999 } as any);
      await expect(service.getParticipants(100, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('registerParticipant', () => {
    const userId = 1;
    const eventId = 100;

    it('should successfully register a new participant', async () => {
      const mockEvent = {
        event_id: eventId,
        is_published: true,
        is_cancelled: false,
        capacity: 50,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvent as any);
      (mockPrismaService.registration.count as jest.Mock).mockResolvedValue(10);
      (
        mockPrismaService.registration.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaService.registration.create as jest.Mock).mockResolvedValue({
        user_id: userId,
        event_id: eventId,
      });

      await service.registerParticipant(eventId, userId);
      expect(prisma.registration.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if event is not published', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ is_published: false } as any);
      await expect(
        service.registerParticipant(eventId, userId),
      ).rejects.toThrow('Event is not published');
    });

    it('should throw BadRequestException if event is cancelled', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ is_published: true, is_cancelled: true } as any);
      await expect(
        service.registerParticipant(eventId, userId),
      ).rejects.toThrow('Event is cancelled');
    });

    it('should throw BadRequestException if event is fully booked (R15)', async () => {
      const mockEvent = {
        is_published: true,
        is_cancelled: false,
        capacity: 10,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvent as any);
      (mockPrismaService.registration.count as jest.Mock).mockResolvedValue(10); // Count equals capacity

      await expect(
        service.registerParticipant(eventId, userId),
      ).rejects.toThrow('Event is fully booked');
    });

    it('should throw ConflictException if already registered with CONFIRMED status', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        is_published: true,
        is_cancelled: false,
        capacity: 50,
      } as any);
      (mockPrismaService.registration.count as jest.Mock).mockResolvedValue(0);
      (
        mockPrismaService.registration.findUnique as jest.Mock
      ).mockResolvedValue({ status: 'CONFIRMED' });

      await expect(
        service.registerParticipant(eventId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-activate registration if previous status was CANCELLED', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        is_published: true,
        is_cancelled: false,
        capacity: 50,
      } as any);
      (mockPrismaService.registration.count as jest.Mock).mockResolvedValue(0);
      (
        mockPrismaService.registration.findUnique as jest.Mock
      ).mockResolvedValue({ status: 'CANCELLED' });
      (mockPrismaService.registration.update as jest.Mock).mockResolvedValue({
        status: 'CONFIRMED',
      });

      const result = await service.registerParticipant(eventId, userId);
      expect(prisma.registration.update).toHaveBeenCalled();
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('cancelRegistration', () => {
    const userId = 1;
    const eventId = 100;

    it('should successfully cancel a confirmed registration', async () => {
      (
        mockPrismaService.registration.findUnique as jest.Mock
      ).mockResolvedValue({ status: 'CONFIRMED' });
      (mockPrismaService.registration.update as jest.Mock).mockResolvedValue({
        status: 'CANCELLED',
      });

      const result = await service.cancelRegistration(eventId, userId);
      expect(result.status).toBe('CANCELLED');
      expect(prisma.registration.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no registration exists', async () => {
      (
        mockPrismaService.registration.findUnique as jest.Mock
      ).mockResolvedValue(null);
      await expect(service.cancelRegistration(eventId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return existing record if already cancelled (no second update)', async () => {
      const existing = { status: 'CANCELLED' };
      (
        mockPrismaService.registration.findUnique as jest.Mock
      ).mockResolvedValue(existing);

      const result = await service.cancelRegistration(eventId, userId);
      expect(result).toEqual(existing);
      expect(prisma.registration.update).not.toHaveBeenCalled();
    });
  });
});
