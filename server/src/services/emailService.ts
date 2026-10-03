import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const isGmail = (env.SMTP_HOST || '').toLowerCase().includes('gmail');
const isSecure = env.SMTP_PORT === 465 || (isGmail && env.SMTP_PORT !== 587);

const transporter = nodemailer.createTransport(
  isGmail
    ? {
        service: 'gmail',
        auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      }
    : {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: isSecure,
        auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      }
);

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('[emailService] SMTP credentials are not configured. Email skipped for:', to);
    return { skipped: true };
  }

  // Gmail rejects sender emails from arbitrary domains that aren't verified
  const fromAddress =
    env.SMTP_FROM && !env.SMTP_FROM.includes('@blockcertify.com')
      ? env.SMTP_FROM
      : `BlockCertify <${env.SMTP_USER}>`;

  try {
    const result = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });
    console.log(`[emailService] Email successfully delivered to: ${to} (MessageId: ${result.messageId})`);
    return result;
  } catch (err: unknown) {
    console.error(`[emailService] Delivery failed to ${to}:`, (err as Error)?.message || err);
    throw err;
  }
};
