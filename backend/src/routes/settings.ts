import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../config/database';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [req.user!.id]
  );

  const settings = result.rows[0] || {
    notifications: true,
    theme: 'light',
    timezone: 'UTC',
    email_alerts: true,
    dashboard_refresh_interval: 30
  };

  res.json({ settings });
}));

// Update user settings
router.put('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    notifications,
    theme,
    timezone,
    email_alerts,
    dashboard_refresh_interval
  } = req.body;

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
    notifications,
    theme,
    timezone,
    email_alerts,
    dashboard_refresh_interval
  ]);

  res.json({ message: 'Settings updated successfully' });
}));

// Get system settings (admin only)
router.get('/system', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user!.role !== 'admin') {
    throw new ApiError('Admin access required', 403);
  }

  const result = await pool.query('SELECT * FROM system_settings LIMIT 1');
  const settings = result.rows[0] || {
    maintenance_mode: false,
    max_users: 100,
    data_retention_days: 90,
    backup_frequency: 'daily'
  };

  res.json({ settings });
}));

// Update system settings (admin only)
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
      INSERT INTO system_settings (maintenance_mode, max_users, data_retention_days, backup_frequency)
      VALUES ($1, $2, $3, $4)
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

  res.json({ message: 'System settings updated successfully' });
}));

export default router;
