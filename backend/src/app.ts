import express, { Express, Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@config/index';
import { APIError } from '@utils/errors';
import logger from '@utils/logger';
import initializeDatabase from '@utils/database-init';
import { initRedis } from '@config/redis';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
  credentials: true,
}));
app.use(compression());

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes (will be added)
// TODO: Add user routes
// TODO: Add admin routes
// TODO: Add mailbox routes
// TODO: Add message routes

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof APIError) {
    logger.error(`API Error: ${err.message}`, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  logger.error('Unhandled error', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});

// Start server
export const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Initialize Redis
    await initRedis();

    app.listen(config.port, config.host, () => {
      logger.info(`Email server running on ${config.host}:${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

export default app;
