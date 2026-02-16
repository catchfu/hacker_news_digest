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

  console.log(`📧 Email config: to=${options.to}, from=${options.from}, smtp=${env.smtpHost}:${env.smtpPort}`);

  const isGmail = env.smtpHost.includes('gmail.com');
  const port = isGmail ? 465 : env.smtpPort;

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: port,
    secure: port === 465,
    auth: {
      user: env.emailSender || env.emailFrom,
      pass: env.emailPassword,
    },
    tls: isGmail ? undefined : {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
  });

  try {
    console.log('📧 Attempting to send email...');
    await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending email:', error?.message || error);
    return false;
  }
}

export async function sendDigestEmail(reportData: ReportData): Promise<boolean> {
  const env = loadEnvConfig();
  const html = toHtml(reportData);
  const date = new Date().toISOString().split('T')[0];

  console.log('DEBUG: Email TO:', env.emailTo);
  console.log('DEBUG: Email FROM:', env.emailFrom);
  console.log('DEBUG: SMTP Host:', env.smtpHost);
  console.log('DEBUG: SMTP Port:', env.smtpPort);

  return sendEmail({
    to: env.emailTo,
    from: env.emailFrom,
    subject: `Hacker News Digest - ${date}`,
    html,
  });
}
