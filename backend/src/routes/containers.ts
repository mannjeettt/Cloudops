import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getContainerStats, getContainerLogs, startContainer, stopContainer } from '../services/containerService';

const router = express.Router();

// Get all containers
router.get('/', async (req, res) => {
  try {
    const containers = await getContainerStats();
    res.json({ containers });
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ message: 'Failed to fetch containers' });
  }
});

// Get container by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const containers = await getContainerStats();
    const container = containers.find(c => c.id === id);

    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }

    res.json({ container });
  } catch (error) {
    console.error('Error fetching container:', error);
    res.status(500).json({ message: 'Failed to fetch container' });
  }
});

// Get container logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { lines = 100 } = req.query;
    const logs = await getContainerLogs(id, parseInt(lines as string));
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching container logs:', error);
    res.status(500).json({ message: 'Failed to fetch container logs' });
  }
});

// Start container
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await startContainer(id);
    res.json({ message: 'Container started successfully' });
  } catch (error) {
    console.error('Error starting container:', error);
    res.status(500).json({ message: 'Failed to start container' });
  }
});

// Stop container
router.post('/:id/stop', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await stopContainer(id);
    res.json({ message: 'Container stopped successfully' });
  } catch (error) {
    console.error('Error stopping container:', error);
    res.status(500).json({ message: 'Failed to stop container' });
  }
});

// Get container statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const containers = await getContainerStats();
    const container = containers.find(c => c.id === id);

    if (!container) {
      return res.status(404).json({ message: 'Container not found' });
    }

    res.json({ stats: container });
  } catch (error) {
    console.error('Error fetching container stats:', error);
    res.status(500).json({ message: 'Failed to fetch container stats' });
  }
});

export default router;
