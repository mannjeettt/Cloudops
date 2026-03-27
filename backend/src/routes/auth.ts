import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { pool } from '../config/database';
import { getJwtSecret } from '../config/env';
import { authenticateToken } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    throw new ApiError(error.details[0].message, 400);
  }

  const { email, password, name } = req.body;

  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ApiError('User already exists', 400);
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await pool.query(
    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
    [email, hashedPassword, name, 'user']
  );

  const user = result.rows[0];
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: '24h' }
  );

  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    throw new ApiError(error.details[0].message, 400);
  }

  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT id, email, password, name, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new ApiError('Invalid credentials', 401);
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new ApiError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, name, role FROM users WHERE id = $1',
    [req.user!.id]
  );

  if (result.rows.length === 0) {
    throw new ApiError('User not found', 404);
  }

  res.json({ user: result.rows[0] });
}));

export default router;
