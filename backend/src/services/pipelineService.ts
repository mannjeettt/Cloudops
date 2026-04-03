import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { broadcastPipelineSnapshot } from '../socket/socketManager';

export type PipelineStatus = 'success' | 'failed' | 'running' | 'pending';
export type PipelineProvider = 'database' | 'github' | 'gitlab' | 'jenkins';

export interface PipelineInfo {
  id: string;
  name: string;
  status: PipelineStatus;
  branch: string;
  commit: string;
  duration?: number;
  startedAt?: Date;
  finishedAt?: Date;
  url?: string;
  provider: PipelineProvider;
  source: string;
}

export interface PipelineHistoryEntry {
  id: number | string;
  pipeline_id: string;
  name: string;
  status: string;
  branch: string | null;
  commit_hash: string | null;
  duration: number | null;
  url: string | null;
  created_at: Date;
  provider?: PipelineProvider;
  source?: string;
}

interface PipelineSourceConfig {
  type: Exclude<PipelineProvider, 'database'>;
  name: string;
  token?: string;
  owner?: string;
  repo?: string;
  projectId?: string;
  baseUrl?: string;
  jobName?: string;
  username?: string;
  branch?: string;
}

const EXTERNAL_PIPELINE_LIMIT = 5;

const parsePipelineSources = (): PipelineSourceConfig[] => {
  const raw = process.env.PIPELINE_SOURCES_JSON?.trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((source): source is PipelineSourceConfig => {
      if (!source || typeof source !== 'object') {
        return false;
      }

      const candidate = source as Record<string, unknown>;
      return typeof candidate.type === 'string' && typeof candidate.name === 'string';
    });
  } catch (error) {
    logger.warn('Unable to parse PIPELINE_SOURCES_JSON, falling back to database-only pipelines', {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
};

const mapPipelineStatus = (status?: string, conclusion?: string | null): PipelineStatus => {
  const normalizedStatus = (status ?? '').toLowerCase();
  const normalizedConclusion = (conclusion ?? '').toLowerCase();

  if (normalizedStatus === 'in_progress' || normalizedStatus === 'running') {
    return 'running';
  }

  if (normalizedStatus === 'queued' || normalizedStatus === 'waiting_for_resource' || normalizedStatus === 'created') {
    return 'pending';
  }

  if (normalizedConclusion === 'success' || normalizedStatus === 'success' || normalizedStatus === 'passed') {
    return 'success';
  }

  if (normalizedConclusion === 'failure' || normalizedStatus === 'failed' || normalizedStatus === 'error' || normalizedStatus === 'canceled') {
    return 'failed';
  }

  return 'pending';
};

const computeDurationSeconds = (startedAt?: string, finishedAt?: string): number | undefined => {
  if (!startedAt || !finishedAt) {
    return undefined;
  }

  const started = new Date(startedAt).getTime();
  const finished = new Date(finishedAt).getTime();

  if (!Number.isFinite(started) || !Number.isFinite(finished) || finished < started) {
    return undefined;
  }

  return Math.round((finished - started) / 1000);
};

const truncateCommit = (commit?: string | null): string => commit?.slice(0, 8) || 'unknown';

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Pipeline provider request failed (${response.status}) for ${url}`);
  }

  return response.json() as Promise<T>;
};

const fetchGitHubPipelines = async (source: PipelineSourceConfig): Promise<PipelineInfo[]> => {
  if (!source.owner || !source.repo) {
    logger.warn('Skipping GitHub pipeline source because owner/repo is missing', { source: source.name });
    return [];
  }

  const runs = await fetchJson<{ workflow_runs?: Array<Record<string, unknown>> }>(
    `https://api.github.com/repos/${source.owner}/${source.repo}/actions/runs?per_page=${EXTERNAL_PIPELINE_LIMIT}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(source.token ? { Authorization: `Bearer ${source.token}` } : {})
      }
    }
  );

  return (runs.workflow_runs ?? []).map((run) => {
    const startedAt = typeof run.run_started_at === 'string' ? run.run_started_at : undefined;
    const finishedAt = typeof run.updated_at === 'string' ? run.updated_at : undefined;

    return {
      id: `github-${String(run.id)}`,
      name: typeof run.name === 'string' ? run.name : `${source.repo} workflow`,
      status: mapPipelineStatus(
        typeof run.status === 'string' ? run.status : undefined,
        typeof run.conclusion === 'string' ? run.conclusion : null
      ),
      branch: typeof run.head_branch === 'string' ? run.head_branch : source.branch || 'main',
      commit: truncateCommit(typeof run.head_sha === 'string' ? run.head_sha : undefined),
      duration: computeDurationSeconds(startedAt, finishedAt),
      startedAt: startedAt ? new Date(startedAt) : undefined,
      finishedAt: finishedAt ? new Date(finishedAt) : undefined,
      url: typeof run.html_url === 'string' ? run.html_url : undefined,
      provider: 'github',
      source: source.name
    };
  });
};

const fetchGitLabPipelines = async (source: PipelineSourceConfig): Promise<PipelineInfo[]> => {
  if (!source.baseUrl || !source.projectId) {
    logger.warn('Skipping GitLab pipeline source because baseUrl/projectId is missing', { source: source.name });
    return [];
  }

  const pipelines = await fetchJson<Array<Record<string, unknown>>>(
    `${source.baseUrl.replace(/\/$/, '')}/api/v4/projects/${encodeURIComponent(source.projectId)}/pipelines?per_page=${EXTERNAL_PIPELINE_LIMIT}`,
    {
      headers: {
        ...(source.token ? { 'PRIVATE-TOKEN': source.token } : {})
      }
    }
  );

  return pipelines.map((pipeline) => {
    const startedAt = typeof pipeline.created_at === 'string' ? pipeline.created_at : undefined;
    const finishedAt = typeof pipeline.updated_at === 'string' ? pipeline.updated_at : undefined;

    return {
      id: `gitlab-${String(pipeline.id)}`,
      name: `${source.name} pipeline`,
      status: mapPipelineStatus(typeof pipeline.status === 'string' ? pipeline.status : undefined),
      branch: typeof pipeline.ref === 'string' ? pipeline.ref : source.branch || 'main',
      commit: truncateCommit(typeof pipeline.sha === 'string' ? pipeline.sha : undefined),
      duration: computeDurationSeconds(startedAt, finishedAt),
      startedAt: startedAt ? new Date(startedAt) : undefined,
      finishedAt: finishedAt ? new Date(finishedAt) : undefined,
      url: typeof pipeline.web_url === 'string' ? pipeline.web_url : undefined,
      provider: 'gitlab',
      source: source.name
    };
  });
};

const fetchJenkinsPipelines = async (source: PipelineSourceConfig): Promise<PipelineInfo[]> => {
  if (!source.baseUrl || !source.jobName) {
    logger.warn('Skipping Jenkins pipeline source because baseUrl/jobName is missing', { source: source.name });
    return [];
  }

  const authHeader = source.username && source.token
    ? `Basic ${Buffer.from(`${source.username}:${source.token}`).toString('base64')}`
    : undefined;
  const payload = await fetchJson<{ builds?: Array<Record<string, unknown>> }>(
    `${source.baseUrl.replace(/\/$/, '')}/job/${encodeURIComponent(source.jobName)}/api/json?tree=builds[number,url,result,timestamp,duration]`,
    {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    }
  );

  return (payload.builds ?? []).slice(0, EXTERNAL_PIPELINE_LIMIT).map((build) => {
    const timestamp = Number(build.timestamp ?? 0);
    const durationMs = Number(build.duration ?? 0);
    const startedAt = timestamp > 0 ? new Date(timestamp) : undefined;
    const finishedAt = startedAt && durationMs > 0 ? new Date(timestamp + durationMs) : undefined;

    return {
      id: `jenkins-${String(build.number ?? build.url ?? source.jobName)}`,
      name: source.jobName || source.name,
      status: mapPipelineStatus(
        durationMs > 0 && !build.result ? 'running' : typeof build.result === 'string' ? build.result : undefined
      ),
      branch: source.branch || 'main',
      commit: 'external',
      duration: durationMs > 0 ? Math.round(durationMs / 1000) : undefined,
      startedAt,
      finishedAt,
      url: typeof build.url === 'string' ? build.url : undefined,
      provider: 'jenkins',
      source: source.name
    };
  });
};

const fetchExternalPipelineStatus = async (): Promise<PipelineInfo[]> => {
  const sources = parsePipelineSources();

  if (sources.length === 0) {
    return [];
  }

  const externalPipelines = await Promise.all(sources.map(async (source) => {
    try {
      if (source.type === 'github') {
        return await fetchGitHubPipelines(source);
      }

      if (source.type === 'gitlab') {
        return await fetchGitLabPipelines(source);
      }

      return await fetchJenkinsPipelines(source);
    } catch (error) {
      logger.warn('Failed to fetch external pipeline source', {
        source: source.name,
        provider: source.type,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }));

  return externalPipelines.flat();
};

const mapDatabasePipeline = (row: Record<string, unknown>): PipelineInfo => ({
  id: String(row.pipeline_id),
  name: String(row.name),
  status: mapPipelineStatus(typeof row.status === 'string' ? row.status : undefined),
  branch: typeof row.branch === 'string' ? row.branch : 'main',
  commit: truncateCommit(typeof row.commit_hash === 'string' ? row.commit_hash : undefined),
  duration: typeof row.duration === 'number' ? row.duration : undefined,
  startedAt: row.created_at instanceof Date ? row.created_at : undefined,
  finishedAt: typeof row.status === 'string' && row.status === 'running'
    ? undefined
    : row.created_at instanceof Date ? row.created_at : undefined,
  url: typeof row.url === 'string' ? row.url : undefined,
  provider: 'database',
  source: 'internal'
});

export const getPipelineStatus = async (): Promise<PipelineInfo[]> => {
  try {
    const [databaseResult, externalPipelines] = await Promise.all([
      pool.query(`
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
      `),
      fetchExternalPipelineStatus()
    ]);

    return [
      ...externalPipelines,
      ...databaseResult.rows.map((row) => mapDatabasePipeline(row as Record<string, unknown>))
    ];
  } catch (error) {
    logger.error('Error fetching pipeline status:', error);
    return [];
  }
};

export const triggerPipeline = async (pipelineId: string, branch: string = 'main', triggeredBy: string = 'system'): Promise<void> => {
  try {
    logger.info(`Triggering pipeline ${pipelineId} on branch ${branch}`);

    await pool.query(
      'INSERT INTO pipeline_triggers (pipeline_id, branch, triggered_by, status) VALUES ($1, $2, $3, $4)',
      [pipelineId, branch, triggeredBy, 'pending']
    );

    await pool.query(
      `INSERT INTO pipeline_history (pipeline_id, name, status, branch, commit_hash, url, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [pipelineId, pipelineId, 'pending', branch, null, null, null]
    );

    broadcastPipelineSnapshot({
      type: 'pipeline.triggered',
      pipelineId,
      branch,
      status: 'pending',
      triggeredBy,
      startedAt: new Date().toISOString()
    });

    setTimeout(async () => {
      try {
        await pool.query(
          'UPDATE pipeline_triggers SET status = $1, started_at = NOW() WHERE pipeline_id = $2 AND status = $3',
          ['running', pipelineId, 'pending']
        );

        broadcastPipelineSnapshot({
          type: 'pipeline.running',
          pipelineId,
          branch,
          status: 'running',
          triggeredBy,
          startedAt: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Error updating pipeline ${pipelineId} to running`, error);
      }
    }, 1000);
  } catch (error) {
    logger.error(`Error triggering pipeline ${pipelineId}:`, error);
    throw error;
  }
};

export const getPipelineHistory = async (pipelineId: string, limit: number = 10): Promise<PipelineHistoryEntry[]> => {
  try {
    let query = `
      SELECT * FROM pipeline_history
      WHERE 1=1
    `;
    const params: Array<string | number> = [];

    if (pipelineId !== 'all') {
      query += ` AND pipeline_id = $${params.length + 1}`;
      params.push(pipelineId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      ...row,
      provider: 'database',
      source: 'internal'
    }));
  } catch (error) {
    logger.error('Error fetching pipeline history:', error);
    return [];
  }
};
