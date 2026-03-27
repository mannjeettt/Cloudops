import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getContainerStats, getContainerLogs, startContainer, stopContainer } from '../services/containerService';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Get all containers
router.get('/', asyncHandler(async (_req, res) => {
  const containers = await getContainerStats();
  res.json({ containers });
}));

// Get container by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const containers = await getContainerStats();
  const container = containers.find((currentContainer) => currentContainer.id === id);

  if (!container) {
    throw new ApiError('Container not found', 404);
  }

  res.json({ container });
}));

// Get container logs
router.get('/:id/logs', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { lines = 100 } = req.query;
  const logs = await getContainerLogs(id, parseInt(lines as string, 10));
  res.json({ logs });
}));

// Start container
router.post('/:id/start', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await startContainer(id);
  res.json({ message: 'Container started successfully' });
}));

// Stop container
router.post('/:id/stop', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await stopContainer(id);
  res.json({ message: 'Container stopped successfully' });
}));

// Get container statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const containers = await getContainerStats();
  const container = containers.find((currentContainer) => currentContainer.id === id);

  if (!container) {
    throw new ApiError('Container not found', 404);
  }

  res.json({ stats: container });
}));

export default router;
