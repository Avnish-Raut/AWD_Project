import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // R11 — Create event
  async create(dto: CreateEventDto, organizerId: number) {
    return this.prisma.event.create({
      data: {
        organizer_id: organizerId,
        title: dto.title,
        description: dto.description,
        event_date: new Date(dto.event_date),
        location: dto.location,
        capacity: dto.capacity,
      },
    });
  }

  // R13 + R33 — List all published events
  async findAllPublished(filters?: {
    search?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { search, location, dateFrom, dateTo } = filters ?? {};
    return this.prisma.event.findMany({
      where: {
        is_published: true,
        is_cancelled: false,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(location
          ? { location: { contains: location, mode: 'insensitive' } }
          : {}),
        ...(dateFrom || dateTo
          ? {
              event_date: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {}),
      },
      include: {
        organizer: { select: { user_id: true, username: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { event_date: 'asc' },
    });
  }

  async findMyEvents(organizerId: number) {
    return this.prisma.event.findMany({
      where: { 
        organizer_id: organizerId,
        is_cancelled: false 
      },
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findUserEvents(userId: number) {
    return this.prisma.event.findMany({
      where: {
        registrations: {
          some: {
            user_id: userId,
            status: 'CONFIRMED',
          },
        },
      },
      include: {
        organizer: {
          select: {
            username: true,
          },
        },
        _count: {
          select: { registrations: { where: { status: 'CONFIRMED' } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // UPDATED: Added documents to include
  async findOne(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { event_id: eventId },
      include: {
        organizer: { select: { user_id: true, username: true } },
        documents: true, // <--- ADD THIS LINE
        _count: {
          select: { registrations: { where: { status: 'CONFIRMED' } } },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  // NEW METHOD: Handle the database record for the file
  async addDocument(eventId: number, userId: number, file: Express.Multer.File) {
    const event = await this.findOne(eventId);
    if (event.organizer_id !== userId)
      throw new ForbiddenException('You can only upload files to your own events');

    return this.prisma.document.create({
      data: {
        event_id: eventId,
        uploaded_by: userId,
        file_name: file.originalname,
        file_path: `/uploads/documents/${file.filename}`,
        file_size_kb: Math.round(file.size / 1024),
      },
    });
  }
  
  // R30 — Update event details
  async update(eventId: number, dto: UpdateEventDto, userId: number) {
    const event = await this.findOne(eventId);
    if (event.organizer_id !== userId)
      throw new ForbiddenException('You can only edit your own events');
    if (event.is_cancelled)
      throw new BadRequestException('Cannot edit a cancelled event');

    const updatedEvent = await this.prisma.event.update({
      where: { event_id: eventId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.event_date !== undefined && {
          event_date: new Date(dto.event_date),
        }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      },
    });

    await this.notifyParticipants(eventId, event.title, 'update');
    return updatedEvent;
  }

  // R21 — Cancel event
  async cancel(eventId: number, userId: number, userRole: string) {
    const event = await this.findOne(eventId);
    if (event.is_cancelled)
      throw new BadRequestException('Event is already cancelled');

    const isAdmin = userRole === 'ADMIN';
    const isOwner = event.organizer_id === userId;
    if (!isAdmin && !isOwner)
      throw new ForbiddenException('Not authorised to cancel this event');

    const cancelledEvent = await this.prisma.event.update({
      where: { event_id: eventId },
      data: { is_cancelled: true, is_published: false },
    });

    await this.notifyParticipants(eventId, event.title, 'cancel');
    return cancelledEvent;
  }

  private async notifyParticipants(eventId: number, title: string, type: 'update' | 'cancel') {
    const registrations = await this.prisma.registration.findMany({
      where: { event_id: eventId, status: 'CONFIRMED' },
      include: { user: { select: { email: true } } },
    });

    for (const reg of registrations) {
      if (type === 'update') {
        this.mailService.sendEventUpdateEmail(reg.user.email, title);
      } else {
        this.mailService.sendEventCancellationEmail(reg.user.email, title);
      }
    }
  }

  async publish(eventId: number, userId: number) {
    const event = await this.findOne(eventId);
    if (event.organizer_id !== userId)
      throw new ForbiddenException('You can only publish your own events');
    if (event.is_cancelled)
      throw new BadRequestException('Cannot publish a cancelled event');

    return this.prisma.event.update({
      where: { event_id: eventId },
      data: { is_published: true },
    });
  }

  async getParticipants(eventId: number, userId: number) {
    const event = await this.findOne(eventId);
    if (event.organizer_id !== userId)
      throw new ForbiddenException('Only the organizer can view the participant list');

    return this.prisma.registration.findMany({
      where: { event_id: eventId, status: 'CONFIRMED' },
      include: {
        user: { select: { user_id: true, username: true, email: true } },
      },
      orderBy: { registered_at: 'asc' },
    });
  }

  async registerParticipant(eventId: number, userId: number) {
    const event = await this.findOne(eventId);
    if (!event.is_published) throw new BadRequestException('Event is not published');
    if (event.is_cancelled) throw new BadRequestException('Event is cancelled');

    const count = await this.prisma.registration.count({
      where: { event_id: eventId, status: 'CONFIRMED' },
    });
    if (count >= event.capacity) throw new BadRequestException('Event is fully booked');

    const existing = await this.prisma.registration.findUnique({
      where: { user_id_event_id: { user_id: userId, event_id: eventId } },
    });
    
    if (existing) {
      if (existing.status === 'CONFIRMED')
        throw new ConflictException('Already registered for this event');
      return this.prisma.registration.update({
        where: { user_id_event_id: { user_id: userId, event_id: eventId } },
        data: { status: 'CONFIRMED' },
      });
    }

    return this.prisma.registration.create({
      data: { user_id: userId, event_id: eventId },
    });
  }

  async cancelRegistration(eventId: number, userId: number) {
    const existing = await this.prisma.registration.findUnique({
      where: { user_id_event_id: { user_id: userId, event_id: eventId } },
    });
    if (!existing) throw new NotFoundException('Registration not found');
    if (existing.status === 'CANCELLED') return existing;

    return this.prisma.registration.update({
      where: { user_id_event_id: { user_id: userId, event_id: eventId } },
      data: { status: 'CANCELLED' },
    });
  }
}