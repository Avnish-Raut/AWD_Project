import { Controller, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ReportService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
// 🔐  Role-based access control for report endpoints
export class ReportController {
  constructor(private service: ReportService) {}

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
