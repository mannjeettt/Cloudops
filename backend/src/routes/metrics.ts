import express from 'express';
import { pool } from '../config/database';
import { collectSystemMetrics } from '../services/metricsService';
import { asyncHandler } from '../utils/asyncHandler';
import { isDemoMode } from '../config/demo';
import { demoMetricsHistory, demoMetricsSummary } from '../data/demoData';

const router = express.Router();

// Get current system metrics
router.get('/current', asyncHandler(async (_req, res) => {
  const metrics = await collectSystemMetrics();
  res.json({ metrics });
}));

// Get historical metrics
router.get('/history', asyncHandler(async (req, res) => {
  const { timeframe = '1h', metric = 'all' } = req.query;
  if (isDemoMode()) {
    const requestedMetric = typeof metric === 'string' ? metric : 'all';
    const metrics = requestedMetric === 'memory'
      ? demoMetricsHistory.memory
      : requestedMetric === 'cpu'
        ? demoMetricsHistory.cpu
        : [...demoMetricsHistory.cpu, ...demoMetricsHistory.memory];
    res.json({ metrics });
    return;
  }
  const allowedTimeframes = new Set(['15m', '30m', '1h', '6h', '12h', '24h', '7d', '30d']);
  const safeTimeframe = typeof timeframe === 'string' && allowedTimeframes.has(timeframe) ? timeframe : '1h';
  const requestedMetric = typeof metric === 'string' ? metric : 'all';

  let query = '';
  const params: string[] = [];

  const intervalMap: Record<string, string> = {
    '15m': '15 minutes',
    '30m': '30 minutes',
    '1h': '1 hour',
    '6h': '6 hours',
    '12h': '12 hours',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };

  query = `
      SELECT * FROM system_metrics
      WHERE created_at >= NOW() - $1::interval
    `;
  params.push(intervalMap[safeTimeframe]);

  if (requestedMetric !== 'all') {
    query += ' AND metric_type = $2';
    params.push(requestedMetric);
  }

  query += ' ORDER BY created_at DESC LIMIT 1000';

  const result = await pool.query(query, params);
  res.json({ metrics: result.rows });
}));

// Get metrics summary
router.get('/summary', asyncHandler(async (_req, res) => {
  if (isDemoMode()) {
    res.json({ summary: demoMetricsSummary });
    return;
  }
  const result = await pool.query(`
      SELECT
        metric_type,
        AVG(value) as average,
        MIN(value) as min,
        MAX(value) as max,
        COUNT(*) as count
      FROM system_metrics
      WHERE created_at >= NOW() - INTERVAL '1 hour'
      GROUP BY metric_type
    `);

  res.json({ summary: result.rows });
}));

export default router;
