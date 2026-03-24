import express from 'express';
import { pool } from '../config/database';
import { collectSystemMetrics } from '../services/metricsService';

const router = express.Router();

// Get current system metrics
router.get('/current', async (req, res) => {
  try {
    const metrics = await collectSystemMetrics();
    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// Get historical metrics
router.get('/history', async (req, res) => {
  try {
    const { timeframe = '1h', metric = 'all' } = req.query;
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
  } catch (error) {
    console.error('Error fetching historical metrics:', error);
    res.status(500).json({ message: 'Failed to fetch historical metrics' });
  }
});

// Get metrics summary
router.get('/summary', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    res.status(500).json({ message: 'Failed to fetch metrics summary' });
  }
});

export default router;
