import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * R18 – Create report request
   * - Validates event existence
   * - Validates organizer ownership
   * - Initializes report as PENDING
   */
  async createReport(eventId: number, organizerId: number) {
    const event = await this.prisma.event.findUnique({
      where: { event_id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');

    // R18 – Ensure organizer owns the event
    if (event.organizer_id !== organizerId)
      throw new ForbiddenException('You do not own this event');

    // Prevent duplicate reports (optional improvement)
    const existing = await this.prisma.report.findFirst({
      where: {
        event_id: eventId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existing) throw new BadRequestException('Report already in progress');

    const report = await this.prisma.report.create({
      data: {
        event_id: eventId,
        organizer_id: organizerId,
        status: ReportStatus.PENDING,
        progress_percent: 0,
      },
    });

    // R19 – Start simulated background processing
    this.processReport(report.report_id);

    return report;
  }

  /**
   * R19 – Simulated async processing
   * - Updates progress
   * - Computes analytics
   * - Stores JSON result
   */
  private async processReport(reportId: number) {
    // Move to IN_PROGRESS
    await this.prisma.report.update({
      where: { report_id: reportId },
      data: { status: ReportStatus.IN_PROGRESS },
    });
    
    this.eventEmitter.emit(`report.progress.${reportId}`, { progress: 0, status: 'IN_PROGRESS' });

    for (let percent = 10; percent <= 100; percent += 10) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await this.prisma.report.update({
        where: { report_id: reportId },
        data: { progress_percent: percent },
      });
      
      this.eventEmitter.emit(`report.progress.${reportId}`, { progress: percent, status: 'IN_PROGRESS' });
    }

    // Fetch registrations to calculate analytics
    const report = await this.prisma.report.findUnique({
      where: { report_id: reportId },
      include: {
        event: {
          include: { registrations: true },
        },
      },
    });

    if (!report) return; // Prevent null access

    const total = report.event.registrations.length;

    const confirmed = report.event.registrations.filter(
      (r) => r.status === 'CONFIRMED',
    ).length;

    const cancelled = report.event.registrations.filter(
      (r) => r.status === 'CANCELLED',
    ).length;

    const occupancyRate =
      report.event.capacity > 0
        ? Math.round((confirmed / report.event.capacity) * 100)
        : 0;

    await this.prisma.report.update({
      where: { report_id: reportId },
      data: {
        status: ReportStatus.DONE,
        result_data: {
          total_registrations: total,
          confirmed_registrations: confirmed,
          cancelled_registrations: cancelled,
          capacity: report.event.capacity,
          occupancy_rate_percent: occupancyRate,
        },
      },
    });
    
    this.eventEmitter.emit(`report.progress.${reportId}`, { progress: 100, status: 'DONE' });
  }

  /**
   * R35 + R36 – View report status + result
   * - Organizer can view own
   * - Admin can view any
   */
  async getReport(reportId: number, user: any) {
    const report = await this.prisma.report.findUnique({
      where: { report_id: reportId },
    });

    if (!report) throw new NotFoundException('Report not found');

    // R37 – Access control validation
    if (user.role !== 'ADMIN' && report.organizer_id !== user.sub) {
      throw new ForbiddenException('Access denied');
    }

    return report;
  }

  /**
   * R37 – Admin can view all reports
   */
  async getAllReports() {
    return this.prisma.report.findMany({
      include: { event: true },
    });
  }
}
