import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/database';
import { validateRequiredEnv } from './config/env';
import authRouter from './routes/auth';
import cloudRouter from './routes/cloud';
import containersRouter from './routes/containers';
import metricsRouter from './routes/metrics';
import pipelinesRouter from './routes/pipelines';
import alertsRouter from './routes/alerts';
import settingsRouter from './routes/settings';
import { initializeSocket } from './socket/socketManager';
import { startCronJobs } from './schedulers/cronJobs';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'CloudOps Backend API' });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/cloud', cloudRouter);
app.use('/api/containers', containersRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/pipelines', pipelinesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/settings', settingsRouter);

const PORT = process.env.PORT || 3001;

initializeSocket(new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  }
}));

export const startServer = async (): Promise<void> => {
  validateRequiredEnv();
  await connectDB();
  startCronJobs();

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      resolve();
    });
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { app, server };
