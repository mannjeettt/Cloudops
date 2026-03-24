import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { emitAlertUpdate, broadcastSystemAlert } from '../socket/socketManager';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  service: string;
  status: 'active' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface AlertRow {
  id: number;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  service: string;
  status: 'active' | 'resolved';
  created_at: Date;
  resolved_at?: Date;
  metadata?: Record<string, unknown>;
}

export const getActiveAlerts = async (): Promise<Alert[]> => {
  try {
    const result = await pool.query(`
      SELECT id, title, message, severity, service, status, created_at, resolved_at, metadata
      FROM alerts
      WHERE status = 'active'
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          WHEN 'info' THEN 3
        END,
        created_at DESC
    `);

    return result.rows.map((row: AlertRow) => ({
      id: String(row.id),
      title: row.title,
      message: row.message,
      severity: row.severity,
      service: row.service,
      status: row.status,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      metadata: row.metadata
    }));
  } catch (error) {
    logger.error('Error fetching active alerts:', error);
    throw error;
  }
};

export const createAlert = async (alertData: {
  title: string;
  message: string;
  severity: string;
  service: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
}): Promise<Alert> => {
  try {
    const result = await pool.query(`
      INSERT INTO alerts (title, message, severity, service, metadata, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, message, severity, service, status, created_at, metadata
    `, [
      alertData.title,
      alertData.message,
      alertData.severity,
      alertData.service,
      JSON.stringify(alertData.metadata || {}),
      alertData.createdBy
    ]);

    const alert = result.rows[0];

    // Emit real-time update
    broadcastSystemAlert({
      id: String(alert.id),
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      service: alert.service,
      createdAt: alert.created_at
    });

    logger.info(`Alert created: ${alert.title} (${alert.severity})`);

    return {
      id: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      service: alert.service,
      status: alert.status,
      createdAt: alert.created_at,
      metadata: alert.metadata
    };
  } catch (error) {
    logger.error('Error creating alert:', error);
    throw error;
  }
};

export const resolveAlert = async (
  alertId: string,
  resolvedBy: string,
  resolution?: string
): Promise<void> => {
  try {
    await pool.query(`
      UPDATE alerts
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $2, resolution = $3
      WHERE id = $1
    `, [alertId, resolvedBy, resolution]);

    logger.info(`Alert ${alertId} resolved by user ${resolvedBy}`);
  } catch (error) {
    logger.error(`Error resolving alert ${alertId}:`, error);
    throw error;
  }
};

export const getAlertHistory = async (limit: number = 50, severity?: string): Promise<Alert[]> => {
  try {
    let query = `
      SELECT id, title, message, severity, service, status, created_at, resolved_at, metadata
      FROM alerts
      WHERE 1=1
    `;
    const params: Array<string | number> = [];

    if (severity) {
      query += ' AND severity = $1';
      params.push(severity);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    return result.rows.map((row: AlertRow) => ({
      id: String(row.id),
      title: row.title,
      message: row.message,
      severity: row.severity,
      service: row.service,
      status: row.status,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      metadata: row.metadata
    }));
  } catch (error) {
    logger.error('Error fetching alert history:', error);
    throw error;
  }
};

// Auto-generate alerts based on system metrics
export const checkSystemAlerts = async (): Promise<void> => {
  try {
    // Check CPU usage
    const cpuResult = await pool.query(`
      SELECT value FROM system_metrics
      WHERE metric_type = 'cpu'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (cpuResult.rows.length > 0) {
      const cpuUsage = cpuResult.rows[0].value;
      if (cpuUsage > 90) {
        await createAlert({
          title: 'High CPU Usage',
          message: `CPU usage is at ${cpuUsage}%`,
          severity: 'critical',
          service: 'system',
          metadata: { cpuUsage },
          createdBy: 'system'
        });
      } else if (cpuUsage > 80) {
        await createAlert({
          title: 'High CPU Usage',
          message: `CPU usage is at ${cpuUsage}%`,
          severity: 'warning',
          service: 'system',
          metadata: { cpuUsage },
          createdBy: 'system'
        });
      }
    }

    // Check memory usage
    const memoryResult = await pool.query(`
      SELECT value FROM system_metrics
      WHERE metric_type = 'memory'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (memoryResult.rows.length > 0) {
      const memoryUsage = memoryResult.rows[0].value;
      if (memoryUsage > 90) {
        await createAlert({
          title: 'High Memory Usage',
          message: `Memory usage is at ${memoryUsage}%`,
          severity: 'critical',
          service: 'system',
          metadata: { memoryUsage },
          createdBy: 'system'
        });
      }
    }
  } catch (error) {
    logger.error('Error checking system alerts:', error);
  }
};
