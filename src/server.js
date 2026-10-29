import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/database.js';

const startServer = async () => {
  const app = createApp();
  const server = http.createServer(app);

  // Attempt database connection on startup
  try {
    await connectDB();
  } catch (dbError) {
    logger.warn('⚠️ Starting server with disconnected database state. Readiness probe will report 503 until connected.', {
      error: dbError.message
    });
  }

  server.listen(env.PORT, () => {
    logger.info(`✨ KAIRO Horology API Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`🔍 Health Liveness Probe:  http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    logger.info(`🔍 Health Readiness Probe: http://localhost:${env.PORT}${env.API_PREFIX}/health/ready`);
  });

  // Graceful Shutdown Handler
  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown of KAIRO API server...`);
    
    server.close(async () => {
      logger.info('HTTP server closed. No longer accepting new connections.');
      try {
        await disconnectDB();
        logger.info('All connections terminated. Exiting cleanly.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during database disconnection:', { error: err.message });
        process.exit(1);
      }
    });

    // Force exit if shutdown hangs beyond 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 10-second timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection detected:', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception detected:', { error: error.message, stack: error.stack });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  return server;
};

// Auto-start when executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default startServer;
