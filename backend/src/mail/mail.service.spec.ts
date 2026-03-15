import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);

    // Setup Env vars
    process.env.SMTP_USER = 'system@test.com';
    process.env.FRONTEND_URL = 'http://localhost:4200';

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Email Methods', () => {
    const testEmail = 'user@example.com';
    const testTitle = 'Angular Workshop';

    it('sendPasswordResetEmail should include the reset link', async () => {
      await service.sendPasswordResetEmail(testEmail, 'token123');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          html: expect.stringContaining('token123'),
        }),
      );
    });

    it('sendRegistrationConfirmation should include the event title', async () => {
      await service.sendRegistrationConfirmation(testEmail, testTitle);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('Registration Confirmed'),
          html: expect.stringContaining(testTitle),
        }),
      );
    });

    it('sendEventReminder should format the date correctly', async () => {
      const date = new Date('2026-05-20T10:00:00');
      await service.sendEventReminder(testEmail, testTitle, date, 'Berlin');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          html: expect.stringContaining('Berlin'),
        }),
      );
      // Ensures .toLocaleString() on the date was executed
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(date.toLocaleString()),
        }),
      );
    });

    it('sendEventUpdateEmail should include the dashboard link', async () => {
      await service.sendEventUpdateEmail(testEmail, testTitle);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Update'),
          html: expect.stringContaining('/events'),
        }),
      );
    });

    it('sendEventCancellationEmail should notify about cancellation', async () => {
      await service.sendEventCancellationEmail(testEmail, testTitle);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('cancelled'),
          html: expect.stringContaining('regret to inform you'),
        }),
      );
    });
  });
});
