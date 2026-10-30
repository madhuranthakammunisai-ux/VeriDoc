import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { inProcessAiWorker } from './services/inProcessAiWorker.js';

const PORT = env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`VeriDoc AI Backend API running at http://${HOST}:${PORT}`, {
    environment: env.NODE_ENV,
    port: PORT,
    clientOrigins: env.CLIENT_ORIGINS,
  });

  // Start in-process AI worker daemon so everything processes out-of-the-box
  inProcessAiWorker.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  inProcessAiWorker.stop();
  server.close(() => {
    logger.info('HTTP server closed cleanly');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  inProcessAiWorker.stop();
  server.close(() => {
    logger.info('HTTP server closed cleanly');
    process.exit(0);
  });
});

