import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { FilesModule } from './files/files.module';
import { ReportsModule } from './reports/reports.module';
import { LogsModule } from './logs/logs.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailService } from './mail/mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    RegistrationsModule,
    FilesModule,
    ReportsModule,
    LogsModule,
    StatisticsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
