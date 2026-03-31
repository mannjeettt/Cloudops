import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCloudProviders,
  connectCloudProvider,
  disconnectCloudProvider,
  getCloudMetrics,
  getCloudResources
} from '../services/cloudService';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { isDemoMode } from '../config/demo';
import { demoCloudMetrics, demoCloudProviders, demoCloudResources } from '../data/demoData';

const router = express.Router();

// Get connected cloud providers
router.get('/providers', asyncHandler(async (_req, res) => {
  if (isDemoMode()) {
    res.json({ providers: demoCloudProviders });
    return;
  }
  const providers = await getCloudProviders();
  res.json({ providers });
}));

// Connect cloud provider
router.post('/providers/:provider/connect', authenticateToken, asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { apiKey, secretKey, region } = req.body;

  if (!apiKey || !secretKey) {
    throw new ApiError('API key and secret key are required', 400);
  }

  await connectCloudProvider(provider, { apiKey, secretKey, region });
  res.json({ message: `${provider} connected successfully` });
}));

// Disconnect cloud provider
router.post('/providers/:provider/disconnect', authenticateToken, asyncHandler(async (req, res) => {
  const { provider } = req.params;
  await disconnectCloudProvider(provider);
  res.json({ message: `${provider} disconnected successfully` });
}));

// Get cloud metrics
router.get('/metrics', asyncHandler(async (req, res) => {
  if (isDemoMode()) {
    const { provider } = req.query;
    const metrics = provider
      ? demoCloudMetrics.filter((metric) => metric.provider === provider)
      : demoCloudMetrics;
    res.json({ metrics });
    return;
  }
  const { provider, timeframe = '1h' } = req.query;
  const metrics = await getCloudMetrics(provider as string, timeframe as string);
  res.json({ metrics });
}));

// Get cloud resources
router.get('/resources', asyncHandler(async (req, res) => {
  if (isDemoMode()) {
    const { provider, type } = req.query;
    const resources = demoCloudResources.filter((resource) => {
      if (provider && resource.provider !== provider) {
        return false;
      }
      if (type && resource.type !== type) {
        return false;
      }
      return true;
    });
    res.json({ resources });
    return;
  }
  const { provider, type } = req.query;
  const resources = await getCloudResources(provider as string, type as string);
  res.json({ resources });
}));

// Get cloud costs
router.get('/costs', asyncHandler(async (req, res) => {
  const { provider, period = 'month' } = req.query;
  const costs = {
    provider,
    period,
    total: 0,
    breakdown: []
  };
  res.json({ costs });
}));

export default router;
