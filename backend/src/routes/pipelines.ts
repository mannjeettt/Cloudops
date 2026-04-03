import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPipelineStatus, triggerPipeline, getPipelineHistory } from '../services/pipelineService';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { isDemoMode } from '../config/demo';
import { demoPipelines } from '../data/demoData';

const router = express.Router();

const getFallbackPipelines = <T>(items: T[]): T[] => (items.length > 0 ? items : demoPipelines as T[]);
const normalizeFilter = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;

// Get all pipelines
router.get('/', asyncHandler(async (req, res) => {
  if (isDemoMode()) {
    res.json({
      pipelines: demoPipelines,
      summary: {
        total: demoPipelines.length,
        running: demoPipelines.filter((pipeline) => pipeline.status === 'running').length,
        success: demoPipelines.filter((pipeline) => pipeline.status === 'success').length,
        failed: demoPipelines.filter((pipeline) => pipeline.status === 'failed').length
      }
    });
    return;
  }
  const providerFilter = normalizeFilter(req.query.provider);
  const sourceFilter = normalizeFilter(req.query.source);
  const pipelines = getFallbackPipelines(await getPipelineStatus()).filter((pipeline) => {
    if (providerFilter && String(pipeline.provider || '').toLowerCase() !== providerFilter) {
      return false;
    }

    if (sourceFilter && String(pipeline.source || '').toLowerCase() !== sourceFilter) {
      return false;
    }

    return true;
  });

  res.json({
    pipelines,
    summary: {
      total: pipelines.length,
      running: pipelines.filter((pipeline) => pipeline.status === 'running').length,
      success: pipelines.filter((pipeline) => pipeline.status === 'success').length,
      failed: pipelines.filter((pipeline) => pipeline.status === 'failed').length
    }
  });
}));

// Get deployment history
router.get('/deployments/history', asyncHandler(async (req, res) => {
  if (isDemoMode()) {
    res.json({ deployments: demoPipelines });
    return;
  }

  const { limit = 20 } = req.query;
  const history = await getPipelineHistory('all', parseInt(limit as string, 10));
  res.json({ deployments: getFallbackPipelines(history) });
}));

// Get pipeline by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isDemoMode()) {
    const pipeline = demoPipelines.find((currentPipeline) => currentPipeline.id === id);
    if (!pipeline) {
      throw new ApiError('Pipeline not found', 404);
    }
    res.json({ pipeline });
    return;
  }
  const pipelines = await getPipelineStatus();
  const pipeline = getFallbackPipelines(pipelines).find((currentPipeline) => currentPipeline.id === id);

  if (!pipeline) {
    throw new ApiError('Pipeline not found', 404);
  }

  res.json({ pipeline });
}));

// Trigger pipeline
router.post('/:id/trigger', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { branch = 'main' } = req.body;

  await triggerPipeline(id, branch, req.user!.id);
  res.json({ message: 'Pipeline triggered successfully' });
}));

// Get pipeline history
router.get('/:id/history', asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (isDemoMode()) {
    const history = id === 'all'
      ? demoPipelines
      : demoPipelines.filter((pipeline) => pipeline.id === id);
    res.json({ history });
    return;
  }
  const { limit = 10 } = req.query;
  const history = await getPipelineHistory(id, parseInt(limit as string, 10));
  res.json({ history: getFallbackPipelines(history) });
}));

export default router;
