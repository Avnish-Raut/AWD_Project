import { Module } from '@nestjs/common';
import { ReportService } from './reports.service';
import { ReportController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportsModule {}
