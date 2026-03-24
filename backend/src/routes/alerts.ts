import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getActiveAlerts, createAlert, resolveAlert, getAlertHistory } from '../services/alertService';

const router = express.Router();

// Get active alerts
router.get('/active', async (req, res) => {
  try {
    const alerts = await getActiveAlerts();
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ message: 'Failed to fetch active alerts' });
  }
});

// Get alert history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, severity } = req.query;
    const alerts = await getAlertHistory(parseInt(limit as string), severity as string);
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ message: 'Failed to fetch alert history' });
  }
});

// Create alert
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, message, severity, service, metadata } = req.body;

    if (!title || !message || !severity) {
      return res.status(400).json({ message: 'Title, message, and severity are required' });
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
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Failed to create alert' });
  }
});

// Resolve alert
router.patch('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    await resolveAlert(id, req.user!.id, resolution);
    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Failed to resolve alert' });
  }
});

// Get alert statistics
router.get('/stats', async (req, res) => {
  try {
    const activeAlerts = await getActiveAlerts();

    const stats = {
      total: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      warning: activeAlerts.filter(a => a.severity === 'warning').length,
      info: activeAlerts.filter(a => a.severity === 'info').length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ message: 'Failed to fetch alert stats' });
  }
});

export default router;
