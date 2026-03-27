export class ApiError extends Error {
  statusCode: number;

  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
