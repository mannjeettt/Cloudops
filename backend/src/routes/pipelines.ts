import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPipelineStatus, triggerPipeline, getPipelineHistory } from '../services/pipelineService';

const router = express.Router();

// Get all pipelines
router.get('/', async (req, res) => {
  try {
    const pipelines = await getPipelineStatus();
    res.json({ pipelines });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ message: 'Failed to fetch pipelines' });
  }
});

// Get pipeline by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pipelines = await getPipelineStatus();
    const pipeline = pipelines.find(p => p.id === id);

    if (!pipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }

    res.json({ pipeline });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({ message: 'Failed to fetch pipeline' });
  }
});

// Trigger pipeline
router.post('/:id/trigger', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { branch = 'main' } = req.body;

    await triggerPipeline(id, branch);
    res.json({ message: 'Pipeline triggered successfully' });
  } catch (error) {
    console.error('Error triggering pipeline:', error);
    res.status(500).json({ message: 'Failed to trigger pipeline' });
  }
});

// Get pipeline history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    const history = await getPipelineHistory(id, parseInt(limit as string));
    res.json({ history });
  } catch (error) {
    console.error('Error fetching pipeline history:', error);
    res.status(500).json({ message: 'Failed to fetch pipeline history' });
  }
});

// Get deployment history
router.get('/deployments/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const history = await getPipelineHistory('all', parseInt(limit as string));
    res.json({ deployments: history });
  } catch (error) {
    console.error('Error fetching deployment history:', error);
    res.status(500).json({ message: 'Failed to fetch deployment history' });
  }
});

export default router;
