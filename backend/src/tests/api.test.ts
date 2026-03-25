import request from 'supertest';
import bcrypt from 'bcryptjs';
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
});
