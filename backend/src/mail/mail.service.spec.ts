import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

// Mock the entire nodemailer module
jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;

  // Create a mock sendMail function
  const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(async () => {
    // Tell the mocked nodemailer to return our mockSendMail function
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);

    // Set up environment variables for the test
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.FRONTEND_URL = 'http://localhost:4200';

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should call sendMail with the correct recipient and formatted link', async () => {
      const email = 'user@example.com';
      const token = 'secret-token-123';

      await service.sendPasswordResetEmail(email, token);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          from: `"Event System" <test@gmail.com>`,
          subject: 'Password Reset Request',
          html: expect.stringContaining(
            'http://localhost:4200/reset-password?token=secret-token-123',
          ),
        }),
      );
    });

    it('should throw an error if transport.sendMail fails', async () => {
      // Simulate a network/SMTP error
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        service.sendPasswordResetEmail('test@test.com', 'token'),
      ).rejects.toThrow('SMTP Error');
    });
  });
});
