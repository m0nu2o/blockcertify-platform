
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('SMTP credentials are not configured. Email skipped for', to);
    return { skipped: true };
  }

  return transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
};
