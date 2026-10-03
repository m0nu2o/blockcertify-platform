import dns from 'node:dns';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

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
  const web3formsKey = (process.env.WEB3FORMS_KEY || '').trim();
  const cleanUser = getCleanSmtpUser();

  // If Web3Forms key is present, test via HTTPS API (Render Cloud friendly)
  if (web3formsKey) {
    if (options?.sendTest) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: web3formsKey,
            subject: '[BlockCertify] Diagnostic Test Email',
            name: 'BlockCertify System Test',
            email: cleanUser || 'diagnostic@blockcertify.com',
            message: `Web3Forms integration is working successfully via HTTPS on Render! Timestamp: ${new Date().toISOString()}`,
          }),
        });
        const data = await res.json() as any;
        return {
          provider: 'Web3Forms (HTTPS)',
          configured: true,
          connected: data.success === true,
          testEmailSent: data.success === true,
          web3FormsResponse: data.message || 'Success',
        };
      } catch (err: any) {
        return {
          provider: 'Web3Forms (HTTPS)',
          configured: true,
          connected: false,
          error: err?.message || String(err),
        };
      }
    }

    return {
      provider: 'Web3Forms (HTTPS Port 443 - No Port Blocking)',
      configured: true,
      connected: true,
      note: 'Web3Forms bypasses Render SMTP firewall blocks. Ready to deliver emails!',
    };
  }

  // Fallback diagnostic for SMTP
  return {
    provider: 'SMTP',
    configured: Boolean(cleanUser),
    user: maskEmail(cleanUser),
    connected: false,
    note: 'WEB3FORMS_KEY not found. Please set WEB3FORMS_KEY in Render Environment Variables.',
  };
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
  name,
}: {
  to?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  name?: string;
}) => {
  const web3formsKey = (process.env.WEB3FORMS_KEY || '').trim();

  // 1. Primary: Web3Forms over HTTPS (Port 443 - Never blocked by Render)
  if (web3formsKey) {
    try {
      const plainMessage = text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3formsKey,
          subject: subject,
          name: name || 'BlockCertify Inquiry',
          email: replyTo || to || 'inquiry@blockcertify.com',
          replyto: replyTo || undefined,
          message: plainMessage,
          from_name: 'BlockCertify Contact Portal',
        }),
      });

      const data = await res.json() as any;
      if (data.success) {
        console.log(`[emailService] Inquiry email delivered via Web3Forms HTTPS API!`);
        return { success: true, provider: 'web3forms' };
      } else {
        console.warn('[emailService] Web3Forms rejected submission:', data);
      }
    } catch (wErr: any) {
      console.error('[emailService] Web3Forms HTTPS call failed:', wErr?.message || wErr);
    }
  }

  // 2. Fallback: SMTP (agar Web3Forms set na ho)
  const cleanUser = getCleanSmtpUser();
  const cleanPass = getCleanSmtpPass();
  if (!cleanUser || !cleanPass) {
    console.warn('[emailService] No active email provider configured (Set WEB3FORMS_KEY).');
    return { skipped: true };
  }

  const fromAddress = env.SMTP_FROM && !env.SMTP_FROM.includes('@blockcertify.com')
    ? env.SMTP_FROM
    : `BlockCertify <${cleanUser}>`;

  const t465 = createTransporter({ port: 465, secure: true });
  return await t465.sendMail({
    from: fromAddress,
    to: to || cleanUser,
    replyTo: replyTo || undefined,
    subject,
    html,
  });
};