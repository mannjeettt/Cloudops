import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { getJwtSecret } from '../config/env';
import { ApiError } from '../utils/apiError';

interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError('Access token required', 401);
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    // Get user from database
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

    next(new ApiError('Invalid token', 403));
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
