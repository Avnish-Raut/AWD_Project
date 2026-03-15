import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import * as express from 'express';
export const fileUploadConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
@Controller('events')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /*
    ==========================================================
    R16 - FILE UPLOAD ENDPOINT
    POST /events/:eventId/files
    Only ORGANIZER allowed
    ==========================================================
  */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORG)
  @Post(':eventId/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // files stored here
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + file.originalname;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit (R26 validation)
      },
    }),
  )
  async uploadFile(
    @Param('eventId', ParseIntPipe) eventId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const userId = req.user.sub;
    //console.log(req.user);
    //console.log(file);
    return this.filesService.uploadFile(eventId, userId, file);
  }

  /*
    ==========================================================
    R17 - FILE DOWNLOAD ENDPOINT
    GET /events/:eventId/files/:fileId
    Organizer OR Registered Participant
    ==========================================================
  */
  @UseGuards(JwtAuthGuard)
  @Get(':eventId/files/:fileId')
  async downloadFile(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Req() req,
    @Res() res: express.Response,
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    const document = await this.filesService.getFileForDownload(
      eventId,
      fileId,
      userId,
      userRole,
    );

    // Send file as download response
    return res.download(document.file_path, document.file_name);
  }
}
