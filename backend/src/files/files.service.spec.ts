import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: PrismaService;

  const mockPrisma = {
    event: { findUnique: jest.fn() },
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    registration: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  // ─── R16: Upload File Tests ────────────────────────────────────

  describe('uploadFile', () => {
    const mockFile = {
      originalname: 'test.pdf',
      path: 'uploads/test.pdf',
      size: 2048,
    } as Express.Multer.File;

    it('should successfully upload a file for the organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: 1,
        organizer_id: 10,
      });
      mockPrisma.document.create.mockResolvedValue({ doc_id: 1, ...mockFile });

      const result = await service.uploadFile(1, 10, mockFile);

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          file_name: 'test.pdf',
          file_size_kb: 2,
        }),
      });
      expect(result.message).toBe('File uploaded successfully');
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      await expect(service.uploadFile(1, 10, mockFile)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: 1,
        organizer_id: 999,
      });
      await expect(service.uploadFile(1, 10, mockFile)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── R17: Get File For Download Tests ──────────────────────────

  describe('getFileForDownload', () => {
    const eventId = 1;
    const fileId = 5;
    const userId = 10;
    const mockDoc = { doc_id: 5, event_id: 1, file_path: 'path/to/file' };

    it('should allow the organizer to download the file', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDoc);
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: eventId,
        organizer_id: userId,
      });

      const result = await service.getFileForDownload(
        eventId,
        fileId,
        userId,
        Role.USER,
      );
      expect(result).toEqual(mockDoc);
    });

    it('should allow a registered participant to download', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDoc);
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: eventId,
        organizer_id: 999,
      });
      mockPrisma.registration.findFirst.mockResolvedValue({ id: 1 }); // User is registered

      const result = await service.getFileForDownload(
        eventId,
        fileId,
        userId,
        Role.USER,
      );
      expect(result).toEqual(mockDoc);
    });

    it('should throw Forbidden if participant is NOT registered', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDoc);
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: eventId,
        organizer_id: 999,
      });
      mockPrisma.registration.findFirst.mockResolvedValue(null); // Not registered

      await expect(
        service.getFileForDownload(eventId, fileId, userId, Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFound if document belongs to a different event', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        ...mockDoc,
        event_id: 999,
      });
      await expect(
        service.getFileForDownload(eventId, fileId, userId, Role.USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw Forbidden for non-organizer roles that are not Role.USER (generic deny)', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDoc);
      mockPrisma.event.findUnique.mockResolvedValue({
        event_id: eventId,
        organizer_id: 999,
      });

      await expect(
        service.getFileForDownload(eventId, fileId, userId, 'OTHER' as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
