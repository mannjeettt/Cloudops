import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const getPostgresErrorCode = (err: CustomError): string | undefined => {
  const maybePostgresError = err as CustomError & { code?: unknown };
  return typeof maybePostgresError.code === 'string' ? maybePostgresError.code : undefined;
};

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('HTTP request failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: err.stack,
    userId: req.user?.id,
    body: req.body,
    query: req.query
  });

  const postgresErrorCode = getPostgresErrorCode(err);

  if (postgresErrorCode) {
    if (postgresErrorCode === '23505') {
      const message = 'Duplicate field value entered';
      error = { ...error, message, statusCode: 409 };
    }

    if (postgresErrorCode === '23503') {
      const message = 'Referenced resource not found';
      error = { ...error, message, statusCode: 400 };
    }

    if (postgresErrorCode === '23502') {
      const message = 'Required field is missing';
      error = { ...error, message, statusCode: 400 };
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { ...error, message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { ...error, message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    error: error.message || 'Server Error',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error: CustomError = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};
