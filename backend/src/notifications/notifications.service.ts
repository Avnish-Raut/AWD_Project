import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * R39 - Reminder Notifications
   * Runs every day at 8:00 AM to send reminders for events happening in exactly 24 hours.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleCron() {
    this.logger.log('Running daily event reminder check...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Find all published events happening tomorrow
    const upcomingEvents = await this.prisma.event.findMany({
      where: {
        event_date: {
          gte: startOfTomorrow,
          lt: endOfTomorrow,
        },
        is_published: true,
        is_cancelled: false,
      },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
          include: {
            user: true,
          },
        },
      },
    });

    let emailsSent = 0;

    for (const event of upcomingEvents) {
      for (const reg of event.registrations) {
        if (reg.user && reg.user.email) {
          try {
            await this.mailService.sendEventReminder(
              reg.user.email,
              event.title,
              event.event_date,
              event.location,
            );
            emailsSent++;
            
            // Log notification creation for audit (Optional: saving to Notification table)
            await this.prisma.notification.create({
              data: {
                user_id: reg.user.user_id,
                message: `Reminder: The event "${event.title}" is happening tomorrow at ${event.event_date.toLocaleString()}.`,
                is_read: false,
              }
            });
            
          } catch (error) {
            this.logger.error(`Failed to send reminder to ${reg.user.email}`, error);
          }
        }
      }
    }

    this.logger.log(`Completed reminder cron job. Reminders sent: ${emailsSent}`);
  }
}
