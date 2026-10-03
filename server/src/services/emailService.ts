import dns from 'node:dns';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

// Force Node.js globally to use IPv4 first
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

export const getCleanSmtpUser = (): string => {
  const raw = env.SMTP_USER || process.env.SMTP_USER || '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
};

export const getCleanSmtpPass = (): string => {
  const raw = env.SMTP_PASS || process.env.SMTP_PASS || '';
  return raw.replace(/\s+/g, '').replace(/^['"]|['"]$/g, '');
};

const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email ? '***' : 'NOT_SET';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
};

export const createTransporter = (options?: { port?: number; secure?: boolean }): Transporter => {
  const cleanUser = getCleanSmtpUser();
  const cleanPass = getCleanSmtpPass();
  const isGmail = (env.SMTP_HOST || '').toLowerCase().includes('gmail') || cleanUser.endsWith('@gmail.com');
  const port = options?.port ?? env.SMTP_PORT ?? (isGmail ? 465 : 587);
  const secure = options?.secure ?? (port === 465);

  return nodemailer.createTransport({
    host: isGmail ? 'smtp.gmail.com' : (env.SMTP_HOST || 'smtp.gmail.com'),
    port,
    secure,
    auth: cleanUser && cleanPass ? {
      user: cleanUser,
      pass: cleanPass,
    } : undefined,
    // CRITICAL: Custom DNS lookup to guarantee ONLY IPv4 on Render cloud containers
    lookup: (hostname: string, _opts: any, callback: any) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
    family: 4,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  } as any);
};

export const verifyEmailConfig = async (options?: { sendTest?: boolean; testRecipient?: string }) => {
  const cleanUser = getCleanSmtpUser();
  const cleanPass = getCleanSmtpPass();
  const host = env.SMTP_HOST || 'smtp.gmail.com';
  const configuredPort = env.SMTP_PORT || 465;

  const summary = {
    configured: Boolean(cleanUser && cleanPass),
    user: maskEmail(cleanUser),
    passLength: cleanPass.length,
    host,
    port: configuredPort,
    connected: false,
    activePort: configuredPort,
    error: undefined as string | undefined,
    errorCode: undefined as string | undefined,
    testEmailSent: false,
    testError: undefined as string | undefined,
  };

  if (!cleanUser || !cleanPass) {
    summary.error = 'SMTP_USER or SMTP_PASS is missing in server environment variables';
    return summary;
  }

  // 1. Try with port 465 first
  let activeTransporter: Transporter | null = null;
  let firstError: any = null;

  try {
    const t465 = createTransporter({ port: 465, secure: true });
    await t465.verify();
    activeTransporter = t465;
    summary.connected = true;
    summary.activePort = 465;
  } catch (err: any) {
    firstError = err;
    console.warn(`[emailService] Port 465 verify failed (${err?.message || err}). Trying port 587...`);
    // Fallback to port 587 (STARTTLS)
    try {
      const t587 = createTransporter({ port: 587, secure: false });
      await t587.verify();
      activeTransporter = t587;
      summary.connected = true;
      summary.activePort = 587;
    } catch (fallbackErr: any) {
      summary.connected = false;
      summary.error = (firstError?.message || '') + ' | Fallback 587: ' + (fallbackErr?.message || '');
      summary.errorCode = firstError?.code || fallbackErr?.code || 'AUTH_OR_CONN_FAILED';
      return summary;
    }
  }

  // 2. If sendTest was requested and connection verified
  if (options?.sendTest && activeTransporter) {
    const to = options.testRecipient || cleanUser;
    try {
      await activeTransporter.sendMail({
        from: `BlockCertify <${cleanUser}>`,
        to,
        subject: '[BlockCertify] SMTP Diagnostic Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">SMTP Configuration Successful!</h2>
            <p>Your BlockCertify email integration is fully operational on Render.</p>
            <p><strong>Connected Port:</strong> ${summary.activePort}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
      });
      summary.testEmailSent = true;
    } catch (testErr: any) {
      summary.testError = testErr?.message || String(testErr);
    }
  }

  return summary;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) => {
  const cleanUser = getCleanSmtpUser();
  const cleanPass = getCleanSmtpPass();

  if (!cleanUser || !cleanPass) {
    console.warn('[emailService] SMTP credentials are not configured. Email skipped for:', to);
    return { skipped: true, reason: 'Credentials not configured' };
  }

  const fromAddress =
    env.SMTP_FROM && !env.SMTP_FROM.includes('@blockcertify.com')
      ? env.SMTP_FROM
      : `BlockCertify <${cleanUser}>`;

  // Try port 465 first
  try {
    const t465 = createTransporter({ port: 465, secure: true });
    const result = await t465.sendMail({
      from: fromAddress,
      to,
      replyTo: replyTo || undefined,
      subject,
      html,
    });
    console.log(`[emailService] Email successfully delivered to: ${to} (MessageId: ${result.messageId}) via port 465`);
    return result;
  } catch (err: any) {
    console.warn(`[emailService] Primary send via 465 failed (${err?.message || err}). Trying port 587...`);
    // Fallback to port 587
    try {
      const t587 = createTransporter({ port: 587, secure: false });
      const result = await t587.sendMail({
        from: fromAddress,
        to,
        replyTo: replyTo || undefined,
        subject,
        html,
      });
      console.log(`[emailService] Fallback delivered to: ${to} (MessageId: ${result.messageId}) via port 587`);
      return result;
    } catch (fallbackErr: any) {
      console.error(`[emailService] Delivery failed to ${to} on both ports 465 & 587:`, fallbackErr?.message || fallbackErr);
      throw fallbackErr;
    }
  }
};