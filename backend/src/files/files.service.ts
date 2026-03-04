import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client'; // adjust if Role enum is elsewhere
import * as fs from 'fs';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  /*
    ==========================================================
    R16 - FILE UPLOAD (Organizer Only)
    ==========================================================
  */
  async uploadFile(eventId: number, userId: number, file: Express.Multer.File) {
    //  Check if event exists

    const event = await this.prisma.event.findUnique({
      where: { event_id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    //  Check if user is organizer of this event
    if (Number(event.organizer_id) !== Number(userId)) {
      throw new ForbiddenException(
        'Only the organizer can upload files for this event',
      );
    }

    //  Save document metadata in database
    const document = await this.prisma.document.create({
      data: {
        event_id: eventId,
        uploaded_by: userId,
        file_name: file.originalname,
        file_path: file.path,
        file_size_kb: Math.ceil(file.size / 1024),
      },
    });

    return {
      message: 'File uploaded successfully',
      document,
    };
  }

  /*
    ==========================================================
    R17 - FILE DOWNLOAD
    Organizer OR Registered Participant
    ==========================================================
  */
  async getFileForDownload(
    eventId: number,
    fileId: number,
    userId: number,
    userRole: Role,
  ) {
    //  Check if document exists
    const document = await this.prisma.document.findUnique({
      where: { doc_id: fileId },
    });

    if (!document || document.event_id !== eventId) {
      throw new NotFoundException('File not found for this event');
    }

    //  If user is organizer of event → allow
    const event = await this.prisma.event.findUnique({
      where: { event_id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizer_id === userId) {
      return document;
    }

    //  If user is participant → check registration
    if (userRole === Role.USER) {
      const registration = await this.prisma.registration.findFirst({
        where: {
          event_id: eventId,
          user_id: userId,
        },
      });

      if (!registration) {
        throw new ForbiddenException(
          'You must be registered to download this file',
        );
      }

      return document;
    }

    //  Otherwise deny
    throw new ForbiddenException('You are not allowed to download this file');
  }
}
