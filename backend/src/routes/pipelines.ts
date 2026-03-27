import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPipelineStatus, triggerPipeline, getPipelineHistory } from '../services/pipelineService';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Get all pipelines
router.get('/', asyncHandler(async (_req, res) => {
  const pipelines = await getPipelineStatus();
  res.json({ pipelines });
}));

// Get pipeline by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pipelines = await getPipelineStatus();
  const pipeline = pipelines.find((currentPipeline) => currentPipeline.id === id);

  if (!pipeline) {
    throw new ApiError('Pipeline not found', 404);
  }

  res.json({ pipeline });
}));

// Trigger pipeline
router.post('/:id/trigger', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { branch = 'main' } = req.body;

  await triggerPipeline(id, branch);
  res.json({ message: 'Pipeline triggered successfully' });
}));

// Get pipeline history
router.get('/:id/history', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;
  const history = await getPipelineHistory(id, parseInt(limit as string, 10));
  res.json({ history });
}));

// Get deployment history
router.get('/deployments/history', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const history = await getPipelineHistory('all', parseInt(limit as string, 10));
  res.json({ deployments: history });
}));

export default router;
