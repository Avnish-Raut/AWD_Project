import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;
  let mailService: MailService;

  const mockPrisma = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    document: {
      create: jest.fn(),
    },
  };

  const mockMailService = {
    sendEventUpdateEmail: jest.fn(),
    sendEventCancellationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
    jest.clearAllMocks();
  });

  // ─── R11: Create Event ─────────────────────────────────────────
  describe('create', () => {
    it('should successfully create an event', async () => {
      const dto = {
        title: 'Test',
        event_date: '2026-05-01',
        location: 'Home',
        capacity: 10,
      };
      await service.create(dto as any, 1);
      expect(prisma.event.create).toHaveBeenCalled();
    });
  });
  describe('EventsService Coverage Boost', () => {
    // ... existing setup ...

    // TARGETING LINES 105-154: findAllPublished filtering logic
    describe('findAllPublished - Specific Filter Branches', () => {
      it('should cover the search-only branch', async () => {
        await service.findAllPublished({ search: 'Gala' });
        expect(prisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                { title: { contains: 'Gala', mode: 'insensitive' } },
              ]),
            }),
          }),
        );
      });

      it('should cover the dateFrom without dateTo branch', async () => {
        await service.findAllPublished({ dateFrom: '2026-01-01' });
        expect(prisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              event_date: { gte: expect.any(Date) },
            }),
          }),
        );
      });

      it('should return empty filters when no object is passed', async () => {
        await service.findAllPublished(undefined);
        expect(prisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { is_published: true, is_cancelled: false },
          }),
        );
      });
    });

    describe('findUserEvents', () => {
      it('should find events where user is a confirmed participant', async () => {
        await service.findUserEvents(5);
        expect(prisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              registrations: {
                some: { user_id: 5, status: 'CONFIRMED' },
              },
            },
          }),
        );
      });
    });

    describe('registerParticipant - Edge Cases', () => {
      it('should throw ConflictException if user is already CONFIRMED', async () => {
        jest.spyOn(service, 'findOne').mockResolvedValue({
          is_published: true,
          is_cancelled: false,
          capacity: 100,
        } as any);
        mockPrisma.registration.count.mockResolvedValue(1);
        mockPrisma.registration.findUnique.mockResolvedValue({
          status: 'CONFIRMED',
        });

        await expect(service.registerParticipant(1, 10)).rejects.toThrow(
          ConflictException,
        );
      });

      it('should create new registration if no existing record found', async () => {
        jest.spyOn(service, 'findOne').mockResolvedValue({
          is_published: true,
          is_cancelled: false,
          capacity: 100,
        } as any);
        mockPrisma.registration.count.mockResolvedValue(0);
        mockPrisma.registration.findUnique.mockResolvedValue(null);

        await service.registerParticipant(1, 10);
        expect(prisma.registration.create).toHaveBeenCalled();
      });
    });

    describe('cancelRegistration', () => {
      it('should return the existing record if already CANCELLED (idempotency)', async () => {
        mockPrisma.registration.findUnique.mockResolvedValue({
          status: 'CANCELLED',
        });

        const result = await service.cancelRegistration(1, 10);

        expect(prisma.registration.update).not.toHaveBeenCalled();
        expect(result.status).toBe('CANCELLED');
      });

      it('should throw NotFoundException if registration record missing', async () => {
        mockPrisma.registration.findUnique.mockResolvedValue(null);
        await expect(service.cancelRegistration(1, 10)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
  // ─── Admin: Find All (Pagination & Search) ─────────────────────
  describe('findAllForAdmin', () => {
    it('should apply search filters and pagination', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.findAllForAdmin('search-term', 10, 5);

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: expect.any(Array) },
          skip: 10,
          take: 5,
        }),
      );
    });
  });

  describe('findAllPublished', () => {
    it('should build filter object correctly with dates and location', async () => {
      await service.findAllPublished({
        location: 'Berlin',
        dateFrom: '2026-01-01',
        dateTo: '2026-02-01',
      });

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: { contains: 'Berlin', mode: 'insensitive' },
            event_date: expect.any(Object),
          }),
        }),
      );
    });
  });

  // ─── Document Upload Logic ─────────────────────────────────────
  describe('addDocument', () => {
    it('should allow organizer to add documents', async () => {
      const mockEvent = { event_id: 1, organizer_id: 10, documents: [] };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvent as any);

      const mockFile = {
        originalname: 'file.pdf',
        filename: 'uuid-file.pdf',
        size: 1024,
      } as any;
      await service.addDocument(1, 10, mockFile);

      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ uploaded_by: 10, file_size_kb: 1 }),
      });
    });

    it('should throw Forbidden if not the organizer', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ event_id: 1, organizer_id: 99 } as any);
      await expect(service.addDocument(1, 10, {} as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── R30: Update Logic ─────────────────────────────────────────
  describe('update', () => {
    it('should update event and notify participants', async () => {
      const mockEvent = {
        event_id: 1,
        organizer_id: 10,
        title: 'Old Title',
        is_cancelled: false,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEvent as any);
      mockPrisma.registration.findMany.mockResolvedValue([
        { user: { email: 'test@test.com' } },
      ]);

      await service.update(1, { title: 'New Title' }, 10);

      expect(prisma.event.update).toHaveBeenCalled();
      expect(mailService.sendEventUpdateEmail).toHaveBeenCalled();
    });

    it('should throw BadRequest if updating a cancelled event', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ is_cancelled: true, organizer_id: 10 } as any);
      await expect(service.update(1, {}, 10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── R21: Cancellation Logic ───────────────────────────────────
  describe('cancel', () => {
    it('should allow Admin to cancel any event', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        event_id: 1,
        organizer_id: 99,
        is_cancelled: false,
      } as any);

      await service.cancel(1, 10, 'ADMIN');

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { event_id: 1 },
        data: expect.objectContaining({ is_cancelled: true }), // This ignores is_published
      });
    });

    it('should throw Forbidden if non-admin tries to cancel someone elses event', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        event_id: 1,
        organizer_id: 99,
        is_cancelled: false,
      } as any);
      await expect(service.cancel(1, 10, 'USER')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── Registration Logic ────────────────────────────────────────
  describe('registerParticipant', () => {
    it('should throw ConflictException if already registered', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        is_published: true,
        is_cancelled: false,
        capacity: 100,
      } as any);
      mockPrisma.registration.count.mockResolvedValue(10);
      mockPrisma.registration.findUnique.mockResolvedValue({
        status: 'CONFIRMED',
      });

      await expect(service.registerParticipant(1, 10)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequest if event is full', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        is_published: true,
        is_cancelled: false,
        capacity: 10,
      } as any);
      mockPrisma.registration.count.mockResolvedValue(10); // Full

      await expect(service.registerParticipant(1, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update status to CONFIRMED if user previously cancelled', async () => {
      // 1. Mock the event with a clear capacity
      jest.spyOn(service, 'findOne').mockResolvedValue({
        is_published: true,
        is_cancelled: false,
        capacity: 10,
      } as any);

      // 2. Mock the current confirmed count to be LOWER than capacity
      mockPrisma.registration.count.mockResolvedValue(0);

      // 3. Mock the existing cancelled registration
      mockPrisma.registration.findUnique.mockResolvedValue({
        status: 'CANCELLED',
      });

      await service.registerParticipant(1, 10);

      expect(prisma.registration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'CONFIRMED' },
        }),
      );
    });
  });
});
