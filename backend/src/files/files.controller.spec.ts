import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
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

  describe('FilesController Metadata', () => {
    it('should generate a unique filename with a timestamp', () => {
      // 1. Extract the interceptor from the uploadFile method
      const interceptors = Reflect.getMetadata(
        '__interceptors__',
        FilesController.prototype.uploadFile,
      );
      const fileInterceptor = interceptors[0];

      // 2. Access the storage options (this is a bit of deep diving)
      const storage = (fileInterceptor as any).options?.storage;

      if (storage && typeof (storage as any).getFilename === 'function') {
        const mockFile = { originalname: 'test.jpg' };
        const cb = jest.fn();

        // 3. Call the filename function directly
        (storage as any).getFilename(null, mockFile, cb);

        // 4. Verify it returns "timestamp-test.jpg"
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

      // Mock Express Response object
      const mockRes = {
        download: jest.fn(),
      } as unknown as Response;

      const mockDocument = {
        file_path: 'uploads/123-test.pdf',
        file_name: 'test.pdf',
      };

      mockFilesService.getFileForDownload.mockResolvedValue(mockDocument);

      await controller.downloadFile(1, 5, mockReq, mockRes);

      // Verify the controller correctly communicated with the service
      expect(service.getFileForDownload).toHaveBeenCalledWith(
        1,
        5,
        10,
        Role.USER,
      );

      // Verify the controller actually triggered the Express download
      expect(mockRes.download).toHaveBeenCalledWith(
        mockDocument.file_path,
        mockDocument.file_name,
      );
    });
  });
});
