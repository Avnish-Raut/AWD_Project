import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: `"Event System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }

  async sendRegistrationConfirmation(email: string, eventTitle: string) {
    await this.transporter.sendMail({
      from: `"Event System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <h3>Registration Confirmed!</h3>
        <p>You have successfully registered for <strong>${eventTitle}</strong>.</p>
        <p>We look forward to seeing you there!</p>
      `,
    });
  }

  async sendEventReminder(email: string, eventTitle: string, eventDate: Date, location: string) {
    await this.transporter.sendMail({
      from: `"Event System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Reminder: Upcoming Event "${eventTitle}"`,
      html: `
        <h3>Event Reminder</h3>
        <p>This is a reminder that <strong>${eventTitle}</strong> is happening soon!</p>
        <ul>
          <li><strong>Date & Time:</strong> ${eventDate.toLocaleString()}</li>
          <li><strong>Location:</strong> ${location}</li>
        </ul>
      `,
    });
  }

  async sendEventUpdateEmail(email: string, eventTitle: string) {
    await this.transporter.sendMail({
      from: `"Event System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Update: Changes to ${eventTitle}`,
      html: `
        <h3>Event Update</h3>
        <p>Hello! We wanted to let you know that the details for <strong>${eventTitle}</strong> have been updated by the organizer.</p>
        <p>Please log in to the dashboard to check the new location or time.</p>
        <a href="${process.env.FRONTEND_URL}/events">View Event Details</a>
      `,
    });
  }

  async sendEventCancellationEmail(email: string, eventTitle: string) {
    await this.transporter.sendMail({
      from: `"Event System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Notice: ${eventTitle} has been cancelled`,
      html: `
        <h3>Event Cancelled</h3>
        <p>We regret to inform you that <strong>${eventTitle}</strong> has been cancelled by the organizer.</p>
        <p>If you have any questions, please contact the organizer directly.</p>
      `,
    });
  }
}
