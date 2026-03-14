import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

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

  // UPDATED: Now filters out cancelled events so they don't reappear on the dashboard
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

  async findOne(eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { event_id: eventId },
      include: {
        organizer: { select: { user_id: true, username: true } },
        _count: {
          select: { registrations: { where: { status: 'CONFIRMED' } } },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(eventId: number, dto: UpdateEventDto, userId: number) {
    const event = await this.findOne(eventId);
    if (event.organizer_id !== userId)
      throw new ForbiddenException('You can only edit your own events');
    if (event.is_cancelled)
      throw new BadRequestException('Cannot edit a cancelled event');

    return this.prisma.event.update({
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

  async cancel(eventId: number, userId: number, userRole: string) {
    const event = await this.findOne(eventId);
    if (event.is_cancelled)
      throw new BadRequestException('Event is already cancelled');

    const isAdmin = userRole === 'ADMIN';
    const isOwner = event.organizer_id === userId;
    if (!isAdmin && !isOwner)
      throw new ForbiddenException('Not authorised to cancel this event');

    return this.prisma.event.update({
      where: { event_id: eventId },
      data: { is_cancelled: true, is_published: false },
    });
  }

  async getParticipants(eventId: number, userId: number) {
    const event = await this.findOne(eventId);
    if (event.organizer_id !== userId)
      throw new ForbiddenException(
        'Only the organizer can view the participant list',
      );

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

    if (!event.is_published)
      throw new BadRequestException('Event is not published');
    if (event.is_cancelled) throw new BadRequestException('Event is cancelled');

    const count = await this.prisma.registration.count({
      where: { event_id: eventId, status: 'CONFIRMED' },
    });
    if (count >= event.capacity)
      throw new BadRequestException('Event is fully booked');

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