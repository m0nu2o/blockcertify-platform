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

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const verifyEmailConfig = async (options?: { sendTest?: boolean; testRecipient?: string }) => {
  const web3formsKey = (process.env.WEB3FORMS_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  const cleanUser = getCleanSmtpUser();

  if (web3formsKey) {
    if (options?.sendTest) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': BROWSER_USER_AGENT,
          },
          body: JSON.stringify({
            access_key: web3formsKey,
            subject: '[BlockCertify] Diagnostic Test Email',
            name: 'BlockCertify System Test',
            email: cleanUser || 'diagnostic@blockcertify.com',
            message: `Web3Forms integration is working successfully via HTTPS on Render! Timestamp: ${new Date().toISOString()}`,
          }),
        });

        const rawText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          return {
            provider: 'Web3Forms (HTTPS)',
            configured: true,
            connected: false,
            error: `Cloudflare challenge triggered: ${rawText.slice(0, 120)}...`,
          };
        }

        return {
          provider: 'Web3Forms (HTTPS)',
          configured: true,
          connected: data.success === true,
          testEmailSent: data.success === true,
          web3FormsResponse: data.message || (data.success ? 'Success' : 'Failed'),
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
      provider: 'Web3Forms (HTTPS)',
      configured: true,
      connected: true,
      keyLength: web3formsKey.length,
      note: 'Web3Forms configured! Add ?sendTest=true to trigger a live test email.',
    };
  }

  return {
    provider: 'None',
    configured: false,
    error: 'WEB3FORMS_KEY is missing in Render environment variables.',
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
  const web3formsKey = (process.env.WEB3FORMS_KEY || '').trim().replace(/^['"]|['"]$/g, '');

  if (web3formsKey) {
    try {
      const plainMessage = text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': BROWSER_USER_AGENT,
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

      const raw = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        console.error('[emailService] Web3Forms returned non-JSON:', raw.slice(0, 150));
      }

      if (data.success) {
        console.log(`[emailService] Inquiry email delivered via Web3Forms!`);
        return { success: true, provider: 'web3forms' };
      }
    } catch (wErr: any) {
      console.error('[emailService] Web3Forms call failed:', wErr?.message || wErr);
    }
  }

  return { skipped: true };
};