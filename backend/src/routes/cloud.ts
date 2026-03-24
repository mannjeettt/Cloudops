import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCloudProviders,
  connectCloudProvider,
  disconnectCloudProvider,
  getCloudMetrics,
  getCloudResources
} from '../services/cloudService';

const router = express.Router();

// Get connected cloud providers
router.get('/providers', async (req, res) => {
  try {
    const providers = await getCloudProviders();
    res.json({ providers });
  } catch (error) {
    console.error('Error fetching cloud providers:', error);
    res.status(500).json({ message: 'Failed to fetch cloud providers' });
  }
});

// Connect cloud provider
router.post('/providers/:provider/connect', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const { apiKey, secretKey, region } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ message: 'API key and secret key are required' });
    }

    await connectCloudProvider(provider, { apiKey, secretKey, region });
    res.json({ message: `${provider} connected successfully` });
  } catch (error) {
    console.error('Error connecting cloud provider:', error);
    res.status(500).json({ message: 'Failed to connect cloud provider' });
  }
});

// Disconnect cloud provider
router.post('/providers/:provider/disconnect', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    await disconnectCloudProvider(provider);
    res.json({ message: `${provider} disconnected successfully` });
  } catch (error) {
    console.error('Error disconnecting cloud provider:', error);
    res.status(500).json({ message: 'Failed to disconnect cloud provider' });
  }
});

// Get cloud metrics
router.get('/metrics', async (req, res) => {
  try {
    const { provider, timeframe = '1h' } = req.query;
    const metrics = await getCloudMetrics(provider as string, timeframe as string);
    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching cloud metrics:', error);
    res.status(500).json({ message: 'Failed to fetch cloud metrics' });
  }
});

// Get cloud resources
router.get('/resources', async (req, res) => {
  try {
    const { provider, type } = req.query;
    const resources = await getCloudResources(provider as string, type as string);
    res.json({ resources });
  } catch (error) {
    console.error('Error fetching cloud resources:', error);
    res.status(500).json({ message: 'Failed to fetch cloud resources' });
  }
});

// Get cloud costs
router.get('/costs', async (req, res) => {
  try {
    const { provider, period = 'month' } = req.query;
    // This would integrate with cloud billing APIs
    const costs = {
      provider,
      period,
      total: 0,
      breakdown: []
    };
    res.json({ costs });
  } catch (error) {
    console.error('Error fetching cloud costs:', error);
    res.status(500).json({ message: 'Failed to fetch cloud costs' });
  }
});

export default router;
