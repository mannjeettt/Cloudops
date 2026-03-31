import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getActiveAlerts, createAlert, resolveAlert, getAlertHistory } from '../services/alertService';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { isDemoMode } from '../config/demo';
import { demoAlerts } from '../data/demoData';

const router = express.Router();

// Get active alerts
router.get('/active', asyncHandler(async (_req, res) => {
  if (isDemoMode()) {
    res.json({ alerts: demoAlerts.filter((alert) => alert.status === 'active') });
    return;
  }
  const alerts = await getActiveAlerts();
  res.json({ alerts });
}));

// Get alert history
router.get('/history', asyncHandler(async (req, res) => {
  if (isDemoMode()) {
    const { limit = 50, severity } = req.query;
    const filteredAlerts = demoAlerts
      .filter((alert) => !severity || alert.severity === severity)
      .slice(0, parseInt(limit as string, 10));
    res.json({ alerts: filteredAlerts });
    return;
  }
  const { limit = 50, severity } = req.query;
  const alerts = await getAlertHistory(parseInt(limit as string, 10), severity as string);
  res.json({ alerts });
}));

// Create alert
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { title, message, severity, service, metadata } = req.body;

  if (!title || !message || !severity) {
    throw new ApiError('Title, message, and severity are required', 400);
  }

  const alert = await createAlert({
    title,
    message,
    severity,
    service,
    metadata,
    createdBy: req.user!.id
  });

  res.status(201).json({ alert });
}));

// Resolve alert
router.patch('/:id/resolve', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution } = req.body;

  await resolveAlert(id, req.user!.id, resolution);
  res.json({ message: 'Alert resolved successfully' });
}));

// Get alert statistics
router.get('/stats', asyncHandler(async (_req, res) => {
  if (isDemoMode()) {
    const activeAlerts = demoAlerts.filter((alert) => alert.status === 'active');
    res.json({
      stats: {
        total: activeAlerts.length,
        critical: activeAlerts.filter((alert) => alert.severity === 'critical').length,
        warning: activeAlerts.filter((alert) => alert.severity === 'warning').length,
        info: activeAlerts.filter((alert) => alert.severity === 'info').length
      }
    });
    return;
  }
  const activeAlerts = await getActiveAlerts();

  const stats = {
    total: activeAlerts.length,
    critical: activeAlerts.filter((alert) => alert.severity === 'critical').length,
    warning: activeAlerts.filter((alert) => alert.severity === 'warning').length,
    info: activeAlerts.filter((alert) => alert.severity === 'info').length
  };

  res.json({ stats });
}));

export default router;
