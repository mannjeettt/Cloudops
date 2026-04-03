import * as os from 'os';
import { execFile } from 'child_process';
import { promises as fsPromises, statfsSync } from 'fs';
import { promisify } from 'util';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { broadcastMetricsSnapshot } from '../socket/socketManager';

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

const execFileAsync = promisify(execFile);
const BYTES_IN_GB = 1024 * 1024 * 1024;
const DEFAULT_TIMEFRAME = '1h';
const TIMEFRAME_TO_INTERVAL: Record<string, string> = {
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '6h': '6 hours',
  '12h': '12 hours',
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days'
};

interface NetworkSample {
  rxBytes: number;
  txBytes: number;
}

interface CpuSnapshot {
  idle: number;
  total: number;
}

interface TimedNetworkSample extends NetworkSample {
  timestamp: number;
}

const SAMPLE_WINDOW_MS = 1000;
let previousCpuSnapshot: CpuSnapshot | null = null;
let previousNetworkSample: TimedNetworkSample | null = null;

export const collectSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    // Memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    const [cpuUsage, diskUsage, networkStats] = await Promise.all([
      getCpuUsage(),
      getDiskUsage(),
      getNetworkStats()
    ]);

    const metrics: SystemMetrics = {
      cpu: roundToTwo(cpuUsage),
      memory: {
        used: roundToTwo(usedMemory / BYTES_IN_GB),
        total: roundToTwo(totalMemory / BYTES_IN_GB),
        percentage: roundToTwo(memoryPercentage)
      },
      disk: diskUsage,
      network: networkStats,
      uptime: os.uptime(),
      loadAverage: os.loadavg()
    };

    // Store metrics in database
    await storeMetrics(metrics);
    broadcastMetricsSnapshot({
      type: 'metrics.snapshot',
      metrics,
      capturedAt: new Date().toISOString()
    });

    return metrics;
  } catch (error) {
    logger.error('Error collecting system metrics:', error);
    throw error;
  }
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const getCpuSnapshot = (): CpuSnapshot => {
  const cpus = os.cpus();

  return cpus.reduce<CpuSnapshot>((totals, cpu) => {
    const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);

    return {
      idle: totals.idle + cpu.times.idle,
      total: totals.total + total
    };
  }, { idle: 0, total: 0 });
};

const calculateCpuUsage = (previous: CpuSnapshot, current: CpuSnapshot): number => {
  const totalDiff = current.total - previous.total;
  const idleDiff = current.idle - previous.idle;

  if (totalDiff <= 0) {
    return 0;
  }

  return ((totalDiff - idleDiff) / totalDiff) * 100;
};

const getCpuUsage = async (): Promise<number> => {
  if (!previousCpuSnapshot) {
    previousCpuSnapshot = getCpuSnapshot();
    await sleep(SAMPLE_WINDOW_MS);
  }

  const currentSnapshot = getCpuSnapshot();
  const usage = previousCpuSnapshot
    ? calculateCpuUsage(previousCpuSnapshot, currentSnapshot)
    : 0;

  previousCpuSnapshot = currentSnapshot;
  return usage;
};

const getDiskUsage = async (): Promise<SystemMetrics['disk']> => {
  try {
    const rootPath = process.platform === 'win32'
      ? `${process.env.SystemDrive ?? 'C:'}\\`
      : '/';
    const stats = statfsSync(rootPath);
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    const freeBytes = Number(stats.bfree) * Number(stats.bsize);
    const usedBytes = Math.max(totalBytes - freeBytes, 0);
    const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    return {
      used: roundToTwo(usedBytes / BYTES_IN_GB),
      total: roundToTwo(totalBytes / BYTES_IN_GB),
      percentage: roundToTwo(percentage)
    };
  } catch (error) {
    logger.warn('Unable to collect disk metrics, defaulting to zero values:', error);
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }
};

const getNetworkStats = async (): Promise<SystemMetrics['network']> => {
  try {
    if (!previousNetworkSample) {
      const firstSnapshot = await readNetworkSnapshot();
      previousNetworkSample = {
        ...firstSnapshot,
        timestamp: Date.now()
      };
      await sleep(SAMPLE_WINDOW_MS);
    }

    const snapshot = await readNetworkSnapshot();
    const timestamp = Date.now();
    const previousSnapshot = previousNetworkSample;

    previousNetworkSample = {
      ...snapshot,
      timestamp
    };

    if (!previousSnapshot) {
      return {
        rx: 0,
        tx: 0
      };
    }

    const durationSeconds = Math.max((timestamp - previousSnapshot.timestamp) / 1000, 1);
    const rxPerSecond = Math.max(snapshot.rxBytes - previousSnapshot.rxBytes, 0) / durationSeconds;
    const txPerSecond = Math.max(snapshot.txBytes - previousSnapshot.txBytes, 0) / durationSeconds;

    return {
      rx: roundToTwo(rxPerSecond / (1024 * 1024)),
      tx: roundToTwo(txPerSecond / (1024 * 1024))
    };
  } catch (error) {
    logger.warn('Unable to collect network metrics, defaulting to zero values:', error);
    return {
      rx: 0,
      tx: 0
    };
  }
};

const readNetworkSnapshot = async (): Promise<NetworkSample> => {
  if (process.platform === 'linux') {
    const interfaceNames = await fsPromises.readdir('/sys/class/net');
    let rxBytes = 0;
    let txBytes = 0;

    for (const interfaceName of interfaceNames) {
      if (interfaceName === 'lo') {
        continue;
      }

      const [rx, tx] = await Promise.all([
        fsPromises.readFile(`/sys/class/net/${interfaceName}/statistics/rx_bytes`, 'utf8'),
        fsPromises.readFile(`/sys/class/net/${interfaceName}/statistics/tx_bytes`, 'utf8')
      ]);

      rxBytes += parseInt(rx.trim(), 10) || 0;
      txBytes += parseInt(tx.trim(), 10) || 0;
    }

    return { rxBytes, txBytes };
  }

  if (process.platform === 'win32') {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-Command',
      "Get-NetAdapterStatistics | Select-Object ReceivedBytes,SentBytes | ConvertTo-Json -Compress"
    ]);
    const parsed = JSON.parse(stdout) as { ReceivedBytes?: number; SentBytes?: number } | Array<{ ReceivedBytes?: number; SentBytes?: number }>;
    const rows = Array.isArray(parsed) ? parsed : [parsed];

    return rows.reduce<NetworkSample>((totals, row) => ({
      rxBytes: totals.rxBytes + Number(row.ReceivedBytes ?? 0),
      txBytes: totals.txBytes + Number(row.SentBytes ?? 0)
    }), { rxBytes: 0, txBytes: 0 });
  }

  throw new Error(`Unsupported platform for network metrics: ${process.platform}`);
};

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const resolveInterval = (timeframe: string): string => TIMEFRAME_TO_INTERVAL[timeframe] ?? TIMEFRAME_TO_INTERVAL[DEFAULT_TIMEFRAME];

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
  timeframe: string = DEFAULT_TIMEFRAME
): Promise<any[]> => {
  try {
    const interval = resolveInterval(timeframe);
    const result = await pool.query(`
      SELECT * FROM system_metrics
      WHERE metric_type = $1
      AND created_at >= NOW() - $2::interval
      ORDER BY created_at DESC
      LIMIT 1000
    `, [metricType, interval]);

    return result.rows;
  } catch (error) {
    logger.error('Error fetching metrics history:', error);
    throw error;
  }
};
