import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { pool } from '../config/database';
import { getJwtSecret } from '../config/env';
import { ApiError } from '../utils/apiError';

interface JwtPayload {
  userId: string;
  email: string;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const extractBearerToken = (authorizationHeader?: string): string => {
  if (!authorizationHeader) {
    throw new ApiError('Access token required', 401);
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError('Bearer token required', 401);
  }

  return token;
};

const isJwtPayload = (value: string | jwt.JwtPayload): value is JwtPayload => {
  if (typeof value === 'string') {
    return false;
  }

  return typeof value.userId === 'string' && typeof value.email === 'string';
};

export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const decoded = jwt.verify(token, getJwtSecret());

    if (!isJwtPayload(decoded)) {
      throw new ApiError('Invalid token payload', 401);
    }

    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError('User not found', 401);
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof TokenExpiredError) {
      next(new ApiError('Token expired', 401));
      return;
    }

    if (error instanceof JsonWebTokenError) {
      next(new ApiError('Invalid token', 401));
      return;
    }

    next(error);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};
