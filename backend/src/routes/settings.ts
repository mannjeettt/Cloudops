import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../config/database';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { broadcastMaintenanceMode } from '../socket/socketManager';

const router = express.Router();

const defaultPreferences = {
  notifications: true,
  theme: 'light',
  timezone: 'UTC',
  email_alerts: true,
  dashboard_refresh_interval: 30
};

interface SettingsUpdatePayload {
  profile?: { name?: string; email?: string };
  preferences?: {
    notifications?: boolean;
    theme?: string;
    timezone?: string;
    email_alerts?: boolean;
    dashboard_refresh_interval?: number;
  };
}

const defaultSystemSettings = {
  maintenance_mode: false,
  max_users: 100,
  data_retention_days: 90,
  backup_frequency: 'daily'
};

router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const [userResult, settingsResult, systemSettingsResult] = await Promise.all([
    pool.query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [req.user!.id]
    ),
    pool.query(
      'SELECT notifications, theme, timezone, email_alerts, dashboard_refresh_interval, updated_at FROM user_settings WHERE user_id = $1',
      [req.user!.id]
    ),
    req.user!.role === 'admin'
      ? pool.query('SELECT maintenance_mode, max_users, data_retention_days, backup_frequency, updated_at FROM system_settings ORDER BY id ASC LIMIT 1')
      : Promise.resolve({ rows: [] })
  ]);

  const profile = userResult.rows[0];
  if (!profile) {
    throw new ApiError('User not found', 404);
  }

  res.json({
    profile,
    preferences: settingsResult.rows[0] || defaultPreferences,
    systemSettings: req.user!.role === 'admin'
      ? (systemSettingsResult.rows[0] || defaultSystemSettings)
      : null
  });
}));

router.put('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    profile = {},
    preferences = {}
  } = req.body as SettingsUpdatePayload;

  if (typeof profile.email === 'string') {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [profile.email, req.user!.id]
    );

    if (existingUser.rows.length > 0) {
      throw new ApiError('Email is already in use', 400);
    }
  }

  await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         updated_at = NOW()
     WHERE id = $3`,
    [profile.name || null, profile.email || null, req.user!.id]
  );

  await pool.query(`
      INSERT INTO user_settings (user_id, notifications, theme, timezone, email_alerts, dashboard_refresh_interval)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        notifications = EXCLUDED.notifications,
        theme = EXCLUDED.theme,
        timezone = EXCLUDED.timezone,
        email_alerts = EXCLUDED.email_alerts,
        dashboard_refresh_interval = EXCLUDED.dashboard_refresh_interval,
        updated_at = NOW()
    `, [
    req.user!.id,
    preferences.notifications ?? defaultPreferences.notifications,
    preferences.theme ?? defaultPreferences.theme,
    preferences.timezone ?? defaultPreferences.timezone,
    preferences.email_alerts ?? defaultPreferences.email_alerts,
    preferences.dashboard_refresh_interval ?? defaultPreferences.dashboard_refresh_interval
  ]);

  const [profileResult, preferencesResult] = await Promise.all([
    pool.query('SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1', [req.user!.id]),
    pool.query(
      'SELECT notifications, theme, timezone, email_alerts, dashboard_refresh_interval, updated_at FROM user_settings WHERE user_id = $1',
      [req.user!.id]
    )
  ]);

  res.json({
    message: 'Settings updated successfully',
    profile: profileResult.rows[0],
    preferences: preferencesResult.rows[0]
  });
}));

router.get('/system', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user!.role !== 'admin') {
    throw new ApiError('Admin access required', 403);
  }

  const result = await pool.query('SELECT maintenance_mode, max_users, data_retention_days, backup_frequency, updated_at FROM system_settings ORDER BY id ASC LIMIT 1');
  res.json({ settings: result.rows[0] || defaultSystemSettings });
}));

router.put('/system', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user!.role !== 'admin') {
    throw new ApiError('Admin access required', 403);
  }

  const {
    maintenance_mode,
    max_users,
    data_retention_days,
    backup_frequency
  } = req.body;

  await pool.query(`
      INSERT INTO system_settings (id, maintenance_mode, max_users, data_retention_days, backup_frequency)
      VALUES (1, $1, $2, $3, $4)
      ON CONFLICT (id)
      DO UPDATE SET
        maintenance_mode = EXCLUDED.maintenance_mode,
        max_users = EXCLUDED.max_users,
        data_retention_days = EXCLUDED.data_retention_days,
        backup_frequency = EXCLUDED.backup_frequency,
        updated_at = NOW()
    `, [
    maintenance_mode,
    max_users,
    data_retention_days,
    backup_frequency
  ]);

  broadcastMaintenanceMode(Boolean(maintenance_mode));

  res.json({ message: 'System settings updated successfully' });
}));

export default router;
