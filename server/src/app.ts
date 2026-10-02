
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
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verification', verificationRateLimiter, verificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/students', studentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
