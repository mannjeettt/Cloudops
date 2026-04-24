import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app, server } from '../server';
import { pool } from '../config/database';
import { createAlert, resolveAlert } from '../services/alertService';
import { getContainerLogs, startContainer, stopContainer } from '../services/containerService';

process.env.JWT_SECRET = 'test-jwt-secret';

jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn()
  },
  connectDB: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../services/alertService', () => ({
  getActiveAlerts: jest.fn().mockResolvedValue([]),
  getAlertHistory: jest.fn().mockResolvedValue([]),
  createAlert: jest.fn(),
  resolveAlert: jest.fn()
}));

jest.mock('../services/containerService', () => ({
  getContainerStats: jest.fn().mockResolvedValue([]),
  getContainerLogs: jest.fn(),
  startContainer: jest.fn(),
  stopContainer: jest.fn()
}));

afterAll((done) => {
  if (server.listening) {
    server.close(done);
    return;
  }

  done();
});

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

  it('should update profile and preferences for authenticated users', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: '2', email: 'user@cloudops.io', role: 'user' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: '2', email: 'updated@cloudops.io', name: 'Updated User', role: 'user' }] })
      .mockResolvedValueOnce({ rows: [{ notifications: false, theme: 'dark', timezone: 'Asia/Calcutta', email_alerts: false, dashboard_refresh_interval: 60 }] });

    const response = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        profile: { name: 'Updated User', email: 'updated@cloudops.io' },
        preferences: {
          notifications: false,
          theme: 'dark',
          timezone: 'Asia/Calcutta',
          email_alerts: false,
          dashboard_refresh_interval: 60
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Settings updated successfully');
    expect(response.body.profile.email).toBe('updated@cloudops.io');
    expect(response.body.preferences.theme).toBe('dark');
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users'),
      ['Updated User', 'updated@cloudops.io', '2']
    );
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_settings'),
      ['2', false, 'dark', 'Asia/Calcutta', false, 60]
    );
  });

  it('should update system settings for admin users', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: '1', email: 'admin@cloudops.io', role: 'admin' }] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .put('/api/settings/system')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        maintenance_mode: true,
        max_users: 50,
        data_retention_days: 30,
        backup_frequency: 'weekly'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('System settings updated successfully');
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO system_settings'),
      [true, 50, 30, 'weekly']
    );
  });
});

describe('Alert routes', () => {
  const mockedQuery = pool.query as jest.Mock;
  const mockedCreateAlert = createAlert as jest.Mock;
  const mockedResolveAlert = resolveAlert as jest.Mock;
  const adminToken = jwt.sign({ userId: '1', email: 'admin@cloudops.io' }, process.env.JWT_SECRET!);

  beforeEach(() => {
    mockedQuery.mockReset();
    mockedCreateAlert.mockReset();
    mockedResolveAlert.mockReset();
  });

  it('should create an alert for authenticated users', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: '1', email: 'admin@cloudops.io', role: 'admin' }] });
    mockedCreateAlert.mockResolvedValueOnce({
      id: 'alert-1',
      title: 'CPU threshold exceeded',
      message: 'CPU usage is high',
      severity: 'critical',
      service: 'system',
      status: 'active',
      createdAt: new Date('2026-04-25T00:00:00.000Z'),
      metadata: { cpu: 95 }
    });

    const response = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'CPU threshold exceeded',
        message: 'CPU usage is high',
        severity: 'critical',
        service: 'system',
        metadata: { cpu: 95 }
      });

    expect(response.status).toBe(201);
    expect(response.body.alert).toMatchObject({
      id: 'alert-1',
      title: 'CPU threshold exceeded',
      severity: 'critical',
      service: 'system'
    });
    expect(mockedCreateAlert).toHaveBeenCalledWith({
      title: 'CPU threshold exceeded',
      message: 'CPU usage is high',
      severity: 'critical',
      service: 'system',
      metadata: { cpu: 95 },
      createdBy: '1'
    });
  });

  it('should resolve an alert for authenticated users', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: '1', email: 'admin@cloudops.io', role: 'admin' }] });
    mockedResolveAlert.mockResolvedValueOnce(undefined);

    const response = await request(app)
      .patch('/api/alerts/alert-1/resolve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolution: 'Scaled service replicas' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Alert resolved successfully');
    expect(mockedResolveAlert).toHaveBeenCalledWith('alert-1', '1', 'Scaled service replicas');
  });
});

describe('Container routes', () => {
  const mockedQuery = pool.query as jest.Mock;
  const mockedGetContainerLogs = getContainerLogs as jest.Mock;
  const mockedStartContainer = startContainer as jest.Mock;
  const mockedStopContainer = stopContainer as jest.Mock;
  const adminToken = jwt.sign({ userId: '1', email: 'admin@cloudops.io' }, process.env.JWT_SECRET!);

  beforeEach(() => {
    mockedQuery.mockReset();
    mockedGetContainerLogs.mockReset();
    mockedStartContainer.mockReset();
    mockedStopContainer.mockReset();
  });

  it('should return container logs', async () => {
    mockedGetContainerLogs.mockResolvedValueOnce(['line one', 'line two']);

    const response = await request(app).get('/api/containers/container-1/logs?lines=25');

    expect(response.status).toBe(200);
    expect(response.body.logs).toEqual(['line one', 'line two']);
    expect(mockedGetContainerLogs).toHaveBeenCalledWith('container-1', 25);
  });

  it('should start a container for authenticated users', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: '1', email: 'admin@cloudops.io', role: 'admin' }] });
    mockedStartContainer.mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post('/api/containers/container-1/start')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Container started successfully');
    expect(mockedStartContainer).toHaveBeenCalledWith('container-1');
  });

  it('should stop a container for authenticated users', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: '1', email: 'admin@cloudops.io', role: 'admin' }] });
    mockedStopContainer.mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post('/api/containers/container-1/stop')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Container stopped successfully');
    expect(mockedStopContainer).toHaveBeenCalledWith('container-1');
  });
});
