import * as os from 'os';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface SystemMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  uptime: number;
  loadAverage: number[];
}

export const collectSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    // CPU usage
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total);
    }, 0) / cpus.length * 100;

    // Memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Disk usage (simplified - in production, use a library like 'diskusage')
    const diskUsage = {
      used: 0,
      total: 0,
      percentage: 0
    };

    // Network (simplified - in production, use system monitoring libraries)
    const networkStats = {
      rx: 0,
      tx: 0
    };

    const metrics: SystemMetrics = {
      cpu: Math.round(cpuUsage * 100) / 100,
      memory: {
        used: Math.round(usedMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
        total: Math.round(totalMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
        percentage: Math.round(memoryPercentage * 100) / 100
      },
      disk: diskUsage,
      network: networkStats,
      uptime: os.uptime(),
      loadAverage: os.loadavg()
    };

    // Store metrics in database
    await storeMetrics(metrics);

    return metrics;
  } catch (error) {
    logger.error('Error collecting system metrics:', error);
    throw error;
  }
};

const storeMetrics = async (metrics: SystemMetrics): Promise<void> => {
  try {
    const client = await pool.connect();

    // Store CPU metrics
    await client.query(
      'INSERT INTO system_metrics (metric_type, value, metadata) VALUES ($1, $2, $3)',
      ['cpu', metrics.cpu, JSON.stringify({ unit: 'percentage' })]
    );

    // Store memory metrics
    await client.query(
      'INSERT INTO system_metrics (metric_type, value, metadata) VALUES ($1, $2, $3)',
      ['memory', metrics.memory.percentage, JSON.stringify({
        used: metrics.memory.used,
        total: metrics.memory.total,
        unit: 'percentage'
      })]
    );

    // Store disk metrics
    await client.query(
      'INSERT INTO system_metrics (metric_type, value, metadata) VALUES ($1, $2, $3)',
      ['disk', metrics.disk.percentage, JSON.stringify({
        used: metrics.disk.used,
        total: metrics.disk.total,
        unit: 'percentage'
      })]
    );

    client.release();
  } catch (error) {
    logger.error('Error storing metrics:', error);
  }
};

export const getMetricsHistory = async (
  metricType: string,
  timeframe: string = '1h'
): Promise<any[]> => {
  try {
    const result = await pool.query(`
      SELECT * FROM system_metrics
      WHERE metric_type = $1
      AND created_at >= NOW() - INTERVAL '${timeframe}'
      ORDER BY created_at DESC
      LIMIT 1000
    `, [metricType]);

    return result.rows;
  } catch (error) {
    logger.error('Error fetching metrics history:', error);
    throw error;
  }
};