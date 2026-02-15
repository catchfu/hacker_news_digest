import * as nodemailer from 'nodemailer';
import { loadEnvConfig } from './config';
import { toHtml } from './formatter';
import { ReportData } from './formatter';

export interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const env = loadEnvConfig();

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
    auth: {
      user: env.emailFrom,
      pass: env.emailPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendDigestEmail(reportData: ReportData): Promise<boolean> {
  const env = loadEnvConfig();
  const html = toHtml(reportData);
  const date = new Date().toISOString().split('T')[0];

  return sendEmail({
    to: env.emailTo,
    from: env.emailFrom,
    subject: `Hacker News Digest - ${date}`,
    html,
  });
}
