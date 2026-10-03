
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import path from 'path';
import xssClean from 'xss-clean';
import { env } from './config/env.js';
import { authRateLimiter, globalRateLimiter, verificationRateLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import explorerRoutes from './routes/explorerRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  /^https:\/\/blockcertify[a-z0-9\-]*\.vercel\.app$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : (o as RegExp).test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,
}));
app.use(globalRateLimiter);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(hpp());
app.use(xssClean());
app.use(morgan('dev'));

// Serves certificate files/metadata that were stored locally because
// PINATA_JWT was not configured (see server/src/services/ipfsService.ts).
app.use('/files', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
  }
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'BlockCertify API healthy' }));
app.get('/api/health/blockchain', async (_req, res) => {
  try {
    const { getBlockchainHealth } = await import('./services/blockchainService.js');
    const health = await getBlockchainHealth();
    const status = health.available ? 200 : 503;
    res.status(status).json({ success: health.available, ...health });
  } catch (err: unknown) {
    res.status(503).json({ success: false, available: false, error: (err as Error)?.message || 'Unknown error' });
  }
});
app.get('/api/health/email', async (req, res) => {
  try {
    const { verifyEmailConfig } = await import('./services/emailService.js');
    const sendTest = req.query.sendTest === 'true';
    const testRecipient = typeof req.query.to === 'string' ? req.query.to : undefined;
    const report = await verifyEmailConfig({ sendTest, testRecipient });
    const status = report.connected ? 200 : 503;
    res.status(status).json(report);
  } catch (err: unknown) {
    res.status(503).json({
      connected: false,
      error: (err as Error)?.message || String(err),
    });
  }
});
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verification', verificationRateLimiter, verificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/students', studentRoutes);

const handleContactInquiry = async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, institution, message, phone } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    try {
      const NotificationModel = (await import('./models/Notification.js')).default;
      const UserModel = (await import('./models/User.js')).default;
      const admin = await UserModel.findOne({ role: 'admin' });
      if (admin) {
        await NotificationModel.create({
          user: admin._id,
          title: `New Inquiry from ${name}`,
          message: `${name} (${email}) from ${institution || 'Independent'} sent an inquiry: "${message.slice(0, 150)}"`,
          type: 'info',
          read: false,
        });
      }
    } catch {
      // ignore notification errors
    }

    try {
      const { sendEmail, getCleanSmtpUser } = await import('./services/emailService.js');
      const adminEmail = getCleanSmtpUser() || process.env.ADMIN_EMAIL || 'admin@blockcertify.com';
      await sendEmail({
        to: adminEmail,
        replyTo: email,
        subject: `[BlockCertify] Inquiry from ${name} (${institution || 'Institution'})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">New Product & Rollout Inquiry</h2>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Institution / Company:</strong> ${institution || 'N/A'}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Message:</strong></p>
            <div style="background: #f8fafc; padding: 14px; border-radius: 6px; border-left: 4px solid #3b82f6; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</div>
            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Sent via BlockCertify Contact Portal</p>
          </div>
        `,
      });
      console.log(`[Contact] Inquiry notification emailed to admin: ${adminEmail}`);
    } catch (emailErr) {
      console.error('[Contact] Email delivery failed:', (emailErr as Error)?.message || emailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Inquiry received successfully! Our team will contact you shortly.',
    });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, message: (err as Error)?.message || 'Failed to submit inquiry' });
  }
};

app.post('/api/contact', handleContactInquiry);
app.post('/contact', handleContactInquiry);

app.use(notFoundHandler);
app.use(errorHandler);
