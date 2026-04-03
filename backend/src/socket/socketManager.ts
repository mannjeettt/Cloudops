import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let ioInstance: Server | null = null;
const DEFAULT_CHANNELS = ['metrics', 'alerts', 'pipelines'];

const emitChannelEvent = (channel: string, event: string, payload: Record<string, unknown>): void => {
  ioInstance?.to(channel).emit(event, payload);
};

export const initializeSocket = (io: Server): void => {
  ioInstance = io;
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    DEFAULT_CHANNELS.forEach((channel) => {
      socket.join(channel);
    });

    // Handle real-time subscriptions
    socket.on('subscribe', (channels: string[]) => {
      channels.forEach(channel => {
        socket.join(channel);
        logger.info(`User ${socket.userId} subscribed to ${channel}`);
      });
    });

    socket.on('unsubscribe', (channels: string[]) => {
      channels.forEach(channel => {
        socket.leave(channel);
        logger.info(`User ${socket.userId} unsubscribed from ${channel}`);
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
    });
  });
};

// Real-time update functions
export const emitMetricsUpdate = (userId: string, metrics: Record<string, unknown>): void => {
  ioInstance?.to(`user_${userId}`).emit('metrics:update', metrics);
  emitChannelEvent('metrics', 'metrics:update', metrics);
};

export const emitAlertUpdate = (userId: string, alert: Record<string, unknown>): void => {
  ioInstance?.to(`user_${userId}`).emit('alert:new', alert);
  emitChannelEvent('alerts', 'alert:update', alert);
};

export const emitContainerUpdate = (userId: string, containerUpdate: Record<string, unknown>): void => {
  ioInstance?.to(`user_${userId}`).emit('container:update', containerUpdate);
};

export const emitPipelineUpdate = (userId: string, pipelineUpdate: Record<string, unknown>): void => {
  ioInstance?.to(`user_${userId}`).emit('pipeline:update', pipelineUpdate);
  emitChannelEvent('pipelines', 'pipeline:update', pipelineUpdate);
};

// Broadcast to all connected users
export const broadcastSystemAlert = (alert: Record<string, unknown>): void => {
  ioInstance?.emit('system:alert', alert);
  emitChannelEvent('alerts', 'alert:update', alert);
};

export const broadcastMetricsSnapshot = (metrics: Record<string, unknown>): void => {
  emitChannelEvent('metrics', 'metrics:update', metrics);
};

export const broadcastPipelineSnapshot = (pipeline: Record<string, unknown>): void => {
  emitChannelEvent('pipelines', 'pipeline:update', pipeline);
};

export const broadcastMaintenanceMode = (enabled: boolean): void => {
  ioInstance?.emit('system:maintenance', { enabled });
};
