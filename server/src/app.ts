
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
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import explorerRoutes from './routes/explorerRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

export const app = express();

const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: process.env.NODE_ENV === 'development' ? 10000 : env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') return true;
    const ip = req.ip || req.socket.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1');
  },
});

const verificationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: process.env.NODE_ENV === 'development' ? 10000 : 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification requests, please try again later.' },
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') return true;
    const ip = req.ip || req.socket.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1');
  },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
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
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verification', verificationRateLimiter, verificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explorer', explorerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
