import { pool } from '../config/database';
import { broadcastPipelineSnapshot } from '../socket/socketManager';
import { clearPipelineTimers, triggerPipeline } from './pipelineService';

jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../socket/socketManager', () => ({
  broadcastPipelineSnapshot: jest.fn()
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

describe('pipelineService trigger behavior', () => {
  const mockedQuery = pool.query as jest.Mock;
  const mockedBroadcastPipelineSnapshot = broadcastPipelineSnapshot as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-25T10:00:00.000Z'));
    mockedQuery.mockReset();
    mockedBroadcastPipelineSnapshot.mockReset();
  });

  afterEach(() => {
    clearPipelineTimers();
    jest.useRealTimers();
  });

  it('records a pending trigger and broadcasts an immediate dashboard invalidation payload', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    await triggerPipeline('deploy-api', 'release/2026.04', 'user-1');

    expect(mockedQuery).toHaveBeenNthCalledWith(
      1,
      'INSERT INTO pipeline_triggers (pipeline_id, branch, triggered_by, status) VALUES ($1, $2, $3, $4)',
      ['deploy-api', 'release/2026.04', 'user-1', 'pending']
    );
    expect(mockedQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO pipeline_history'),
      ['deploy-api', 'deploy-api', 'pending', 'release/2026.04', null, null, null]
    );
    expect(mockedBroadcastPipelineSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      type: 'pipeline.triggered',
      pipelineId: 'deploy-api',
      branch: 'release/2026.04',
      status: 'pending',
      triggeredBy: 'user-1'
    }));
  });

  it('updates the trigger to running and broadcasts after the scheduled delay', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    await triggerPipeline('deploy-api', 'main', 'user-1');
    await jest.advanceTimersByTimeAsync(1000);

    expect(mockedQuery).toHaveBeenCalledWith(
      'UPDATE pipeline_triggers SET status = $1, started_at = NOW() WHERE pipeline_id = $2 AND status = $3',
      ['running', 'deploy-api', 'pending']
    );
    expect(mockedBroadcastPipelineSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      type: 'pipeline.running',
      pipelineId: 'deploy-api',
      branch: 'main',
      status: 'running',
      triggeredBy: 'user-1'
    }));
  });
});
