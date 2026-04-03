import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { pool } from '../config/database';

process.env.JWT_SECRET = 'test-jwt-secret';

jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn()
  },
  connectDB: jest.fn().mockResolvedValue(undefined)
}));

describe('API Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });
});

describe('Authentication', () => {
  const mockedQuery = pool.query as jest.Mock;
  const testToken = jwt.sign({ userId: '1', email: 'admin@cloudops.io' }, process.env.JWT_SECRET!);

  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('should register a new user', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, email: 'test@example.com', name: 'Test User', role: 'user' }]
      });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });

  it('should login user', async () => {
    const hashedPassword = await bcrypt.hash('password123', 1);
    mockedQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', password: hashedPassword, name: 'Test User', role: 'user' }]
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should reject /me without a token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Access token required');
  });

  it('should return the current user for a valid token', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        rows: [{ id: '1', email: 'admin@cloudops.io', role: 'admin' }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: '1', email: 'admin@cloudops.io', name: 'Admin User', role: 'admin' }]
      });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: '1',
      email: 'admin@cloudops.io',
      role: 'admin'
    });
  });
});

describe('Settings routes', () => {
  const mockedQuery = pool.query as jest.Mock;
  const adminToken = jwt.sign({ userId: '1', email: 'admin@cloudops.io' }, process.env.JWT_SECRET!);
  const userToken = jwt.sign({ userId: '2', email: 'user@cloudops.io' }, process.env.JWT_SECRET!);

  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('should return profile and preferences for authenticated users', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: '1', email: 'admin@cloudops.io', role: 'admin' }] })
      .mockResolvedValueOnce({ rows: [{ id: '1', email: 'admin@cloudops.io', name: 'Admin User', role: 'admin' }] })
      .mockResolvedValueOnce({ rows: [{ notifications: true, theme: 'light', timezone: 'UTC', email_alerts: true, dashboard_refresh_interval: 30 }] })
      .mockResolvedValueOnce({ rows: [{ maintenance_mode: false, max_users: 100, data_retention_days: 90, backup_frequency: 'daily' }] });

    const response = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.email).toBe('admin@cloudops.io');
    expect(response.body.preferences.theme).toBe('light');
    expect(response.body.systemSettings.max_users).toBe(100);
  });

  it('should block non-admin users from system settings', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: '2', email: 'user@cloudops.io', role: 'user' }] });

    const response = await request(app)
      .get('/api/settings/system')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Admin access required');
  });
});
