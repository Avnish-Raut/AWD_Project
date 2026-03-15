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
}
