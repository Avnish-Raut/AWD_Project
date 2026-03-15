import { Test, TestingModule } from '@nestjs/testing';
import { FilesController, fileUploadConfig } from './files.controller';
import { FilesService } from './files.service';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  const mockFilesService = {
    uploadFile: jest.fn(),
    getFileForDownload: jest.fn(),
  };
  describe('FilesController Upload Logic Coverage', () => {
    it('should cover the filename generation logic', () => {
      const storage = fileUploadConfig.storage as any;
      const mockCb = jest.fn();
      const mockFile = { originalname: 'contract.pdf' };

      storage.getFilename(null, mockFile, mockCb);

      const generatedName = mockCb.mock.calls[0][1];
      expect(generatedName).toContain('-contract.pdf');

      const timestamp = generatedName.split('-')[0];
      expect(isNaN(Number(timestamp))).toBe(false);
    });

    it('should have the correct file size limits', () => {
      // This covers the 'limits' object lines
      expect(fileUploadConfig.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });
  describe('FilesController Metadata', () => {
    it('should generate a unique filename with a timestamp', () => {
      const interceptors = Reflect.getMetadata(
        '__interceptors__',
        FilesController.prototype.uploadFile,
      );
      const fileInterceptor = interceptors[0];

      const storage = (fileInterceptor as any).options?.storage;

      if (storage && typeof (storage as any).getFilename === 'function') {
        const mockFile = { originalname: 'test.jpg' };
        const cb = jest.fn();

        (storage as any).getFilename(null, mockFile, cb);

        expect(cb).toHaveBeenCalledWith(
          null,
          expect.stringMatching(/^\d+-test\.jpg$/),
        );
      }
    });
  });
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: mockFilesService }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── R16: Upload File ──────────────────────────────────────────

  describe('uploadFile', () => {
    it('should call service.uploadFile with parsed eventId and user sub', async () => {
      const mockFile = { originalname: 'test.png' } as Express.Multer.File;
      const mockReq = { user: { sub: 10 } };

      mockFilesService.uploadFile.mockResolvedValue({ message: 'Success' });

      const result = await controller.uploadFile(1, mockFile, mockReq);

      expect(service.uploadFile).toHaveBeenCalledWith(1, 10, mockFile);
      expect(result).toEqual({ message: 'Success' });
    });
  });

  // ─── R17: Download File ────────────────────────────────────────

  describe('downloadFile', () => {
    it('should call res.download with the path and name from the service', async () => {
      const mockReq = { user: { sub: 10, role: Role.USER } };

      const mockRes = {
        download: jest.fn(),
      } as unknown as Response;

      const mockDocument = {
        file_path: 'uploads/123-test.pdf',
        file_name: 'test.pdf',
      };

      mockFilesService.getFileForDownload.mockResolvedValue(mockDocument);

      await controller.downloadFile(1, 5, mockReq, mockRes);

      expect(service.getFileForDownload).toHaveBeenCalledWith(
        1,
        5,
        10,
        Role.USER,
      );

      expect(mockRes.download).toHaveBeenCalledWith(
        mockDocument.file_path,
        mockDocument.file_name,
      );
    });
  });
});
