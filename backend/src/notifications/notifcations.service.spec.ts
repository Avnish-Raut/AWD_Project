import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let mailService: MailService;

  const mockPrisma = {
    event: { findMany: jest.fn() },
    notification: { create: jest.fn() },
  };

  const mockMailService = {
    sendEventReminder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
    jest.clearAllMocks();
  });

  describe('handleCron', () => {
    it('should find upcoming events and send reminders to confirmed users', async () => {
      const mockEventDate = new Date();
      mockEventDate.setDate(mockEventDate.getDate() + 1);

      const mockEvents = [
        {
          event_id: 1,
          title: 'Tomorrow Party',
          event_date: mockEventDate,
          location: 'Club Nest',
          registrations: [
            {
              user: { user_id: 10, email: 'user@test.com' },
            },
          ],
        },
      ];

      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      mockMailService.sendEventReminder.mockResolvedValue(null);
      mockPrisma.notification.create.mockResolvedValue({});

      await service.handleCron();

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            event_date: expect.any(Object),
            is_published: true,
            is_cancelled: false,
          }),
        }),
      );

      expect(mailService.sendEventReminder).toHaveBeenCalledWith(
        'user@test.com',
        'Tomorrow Party',
        mockEventDate,
        'Club Nest',
      );

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ user_id: 10 }),
        }),
      );
    });

    it('should catch and log errors if mailService fails for a specific user', async () => {
      const mockEvents = [
        {
          event_id: 2,
          title: 'Failure Event',
          event_date: new Date(),
          location: 'Nowhere',
          registrations: [{ user: { user_id: 11, email: 'fail@test.com' } }],
        },
      ];

      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      mockMailService.sendEventReminder.mockRejectedValue(
        new Error('SMTP Down'),
      );

      const loggerSpy = jest.spyOn((service as any).logger, 'error');

      await service.handleCron();

      expect(loggerSpy).toHaveBeenCalled();

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should skip if user or email is missing', async () => {
      const mockEvents = [
        {
          registrations: [{ user: null }],
        },
      ];
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);

      await service.handleCron();
      expect(mailService.sendEventReminder).not.toHaveBeenCalled();
    });
  });
});
