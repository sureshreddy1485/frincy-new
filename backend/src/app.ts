import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config';
import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimiter';
import { logger } from './config/logger.config';

const app: Application = express();

// Trust Render's reverse proxy so express-rate-limit can read real client IPs
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
app.use('/api', apiLimiter);

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

import customerRoutes from './routes/customer.routes';
import ledgerRoutes from './routes/ledger.routes';
import transactionRoutes from './routes/transaction.routes';
import businessRoutes from './routes/business.routes';
import memberRoutes from './routes/member.routes';
import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import aiRoutes from './routes/ai.routes';
import { authenticate } from './middlewares/auth.middleware';

// Public API Routes
app.use('/api/v1/auth', authRoutes);

// Protected API Routes
app.use('/api/v1/sync', authenticate, syncRoutes);
app.use('/api/v1/customers', authenticate, customerRoutes);
app.use('/api/v1/ledgers', authenticate, ledgerRoutes);
app.use('/api/v1/transactions', authenticate, transactionRoutes);
app.use('/api/v1/businesses', authenticate, businessRoutes);
app.use('/api/v1/businesses/:businessId/members', authenticate, memberRoutes);
app.use('/api/v1/ai', authenticate, aiRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
