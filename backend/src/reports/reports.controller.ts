import { Controller, Post, Get, Param, Req, UseGuards, Sse } from '@nestjs/common';
import { ReportService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Observable, fromEvent, map } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(
    private service: ReportService,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * R19 - Server-Sent Events (SSE) for Real-Time Progress
   * Organizer can stream report progress
   */
  @Sse('reports/:id/progress')
  @Roles(Role.ORG, Role.ADMIN)
  streamProgress(@Param('id') id: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, `report.progress.${id}`).pipe(
      map((payload) => {
        return {
          data: payload,
        } as MessageEvent;
      }),
    );
  }

  /**
   * R18 – Generate Event Report
   * Only Organizer can request report for their own event
   */
  @Post(':id/report/generate')
  @Roles(Role.ORG)
  create(@Param('id') id: string, @Req() req) {
    return this.service.createReport(+id, req.user.sub);
  }

  /**
   *  R18– View report status and results
   * Organizer can view own reports
   * Admin can view any report
   */
  @Get('reports/:id')
  get(@Param('id') id: string, @Req() req) {
    return this.service.getReport(+id, req.user);
  }

  /**
   * – Admin can view all reports
   */
  @Get('reports')
  @Roles(Role.ADMIN)
  getAll() {
    return this.service.getAllReports();
  }
}
