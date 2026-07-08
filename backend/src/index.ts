import app from './app';
import { env } from './config/env.config';
import { logger } from './config/logger.config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const startServer = async () => {
  try {
    // Test Database Connection
    await prisma.$connect();
    logger.info('📦 Connected to PostgreSQL database');

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
      });
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
