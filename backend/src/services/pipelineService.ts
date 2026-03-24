import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface PipelineInfo {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  branch: string;
  commit: string;
  duration?: number;
  startedAt?: Date;
  finishedAt?: Date;
  url?: string;
}

export const getPipelineStatus = async (): Promise<PipelineInfo[]> => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (pipeline_id)
        pipeline_id,
        name,
        status,
        branch,
        commit_hash,
        duration,
        created_at,
        url
      FROM pipeline_history
      ORDER BY pipeline_id, created_at DESC
    `);

    return result.rows.map((row) => ({
      id: row.pipeline_id,
      name: row.name,
      status: row.status,
      branch: row.branch || 'main',
      commit: row.commit_hash || 'unknown',
      duration: row.duration || undefined,
      startedAt: row.created_at,
      finishedAt: row.status === 'running' ? undefined : row.created_at,
      url: row.url || undefined
    }));
  } catch (error) {
    logger.error('Error fetching pipeline status:', error);
    return [];
  }
};

export const triggerPipeline = async (pipelineId: string, branch: string = 'main'): Promise<void> => {
  try {
    // In a real implementation, this would trigger the CI/CD system
    logger.info(`Triggering pipeline ${pipelineId} on branch ${branch}`);

    // Store the trigger action
    await pool.query(
      'INSERT INTO pipeline_triggers (pipeline_id, branch, triggered_by, status) VALUES ($1, $2, $3, $4)',
      [pipelineId, branch, 'system', 'pending']
    );

    // Simulate pipeline start
    setTimeout(async () => {
      await pool.query(
        'UPDATE pipeline_triggers SET status = $1, started_at = NOW() WHERE pipeline_id = $2 AND status = $3',
        ['running', pipelineId, 'pending']
      );
    }, 1000);

  } catch (error) {
    logger.error(`Error triggering pipeline ${pipelineId}:`, error);
    throw error;
  }
};

export interface PipelineHistoryEntry {
  id: number;
  pipeline_id: string;
  name: string;
  status: string;
  branch: string | null;
  commit_hash: string | null;
  duration: number | null;
  url: string | null;
  created_at: Date;
}

export const getPipelineHistory = async (pipelineId: string, limit: number = 10): Promise<PipelineHistoryEntry[]> => {
  try {
    let query = `
      SELECT * FROM pipeline_history
      WHERE 1=1
    `;
    const params: Array<string | number> = [];

    if (pipelineId !== 'all') {
      query += ' AND pipeline_id = $1';
      params.push(pipelineId);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching pipeline history:', error);
    return [];
  }
};
