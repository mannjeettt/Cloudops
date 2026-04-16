import AWS from 'aws-sdk';
import { DefaultAzureCredential } from '@azure/identity';
import { MetricsQueryClient } from '@azure/monitor-query';
import { MetricServiceClient } from '@google-cloud/monitoring';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface CloudProvider {
  name: string;
  status: 'connected' | 'disconnected';
  services: number;
  region?: string;
}

interface CloudProviderCredentials {
  apiKey?: string;
  secretKey?: string;
  region?: string;
  projectId?: string;
}

type CloudMetrics = {
  provider: 'AWS' | 'Azure' | 'GCP';
  services: string[];
  instances?: number;
  subscriptions?: number;
  projects?: number;
  region?: string;
  status?: 'connected';
};

interface CloudResource {
  id: string;
  type: string;
  name: string;
  status: string;
}

const toCloudProviderCredentials = (value: unknown): CloudProviderCredentials => {
  if (typeof value === 'string') {
    return JSON.parse(value) as CloudProviderCredentials;
  }

  return (value ?? {}) as CloudProviderCredentials;
};

export const getCloudProviders = async (): Promise<CloudProvider[]> => {
  try {
    const result = await pool.query('SELECT * FROM cloud_providers');
    return result.rows.map(row => ({
      name: row.name,
      status: row.status,
      services: row.services || 0,
      region: row.region
    }));
  } catch (error) {
    logger.error('Error fetching cloud providers:', error);
    // Return default providers if table doesn't exist
    return [
      { name: 'AWS', status: 'disconnected', services: 0 },
      { name: 'Azure', status: 'disconnected', services: 0 },
      { name: 'GCP', status: 'disconnected', services: 0 }
    ];
  }
};

export const connectCloudProvider = async (
  provider: string,
  credentials: { apiKey?: string; secretKey?: string; region?: string }
): Promise<void> => {
  try {
    // Store credentials securely (in production, use a secrets manager)
    await pool.query(`
      INSERT INTO cloud_providers (name, status, credentials, region)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name)
      DO UPDATE SET
        status = EXCLUDED.status,
        credentials = EXCLUDED.credentials,
        region = EXCLUDED.region,
        updated_at = NOW()
    `, [
      provider,
      'connected',
      JSON.stringify(credentials),
      credentials.region
    ]);

    logger.info(`Connected to ${provider}`);
  } catch (error) {
    logger.error(`Error connecting to ${provider}:`, error);
    throw error;
  }
};

export const disconnectCloudProvider = async (provider: string): Promise<void> => {
  try {
    await pool.query(
      'UPDATE cloud_providers SET status = $1, updated_at = NOW() WHERE name = $2',
      ['disconnected', provider]
    );

    logger.info(`Disconnected from ${provider}`);
  } catch (error) {
    logger.error(`Error disconnecting from ${provider}:`, error);
    throw error;
  }
};

export const getCloudMetrics = async (provider: string, timeframe: string = '1h'): Promise<CloudMetrics> => {
  try {
    const providerData = await pool.query(
      'SELECT * FROM cloud_providers WHERE name = $1 AND status = $2',
      [provider, 'connected']
    );

    if (providerData.rows.length === 0) {
      throw new Error(`${provider} is not connected`);
    }

    const credentials = toCloudProviderCredentials(providerData.rows[0].credentials);

    switch (provider.toLowerCase()) {
      case 'aws':
        return await getAWSMetrics(credentials, timeframe);
      case 'azure':
        return await getAzureMetrics(credentials, timeframe);
      case 'gcp':
        return await getGCPMetrics(credentials, timeframe);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    logger.error(`Error fetching ${provider} metrics:`, error);
    throw error;
  }
};

const getAWSMetrics = async (credentials: CloudProviderCredentials, _timeframe: string): Promise<CloudMetrics> => {
  // Configure AWS SDK
  AWS.config.update({
    accessKeyId: credentials.apiKey,
    secretAccessKey: credentials.secretKey,
    region: credentials.region || 'us-east-1'
  });

  // Get EC2 instances
  const ec2 = new AWS.EC2();
  const instances = await ec2.describeInstances().promise();

  // Get basic metrics
  const metrics: CloudMetrics = {
    provider: 'AWS',
    instances: instances.Reservations?.length || 0,
    region: credentials.region,
    services: ['EC2', 'S3', 'RDS'] // Simplified
  };

  return metrics;
};

const getAzureMetrics = async (_credentials: CloudProviderCredentials, _timeframe: string): Promise<CloudMetrics> => {
  // Azure monitoring
  const credential = new DefaultAzureCredential();
  new MetricsQueryClient(credential);

  const metrics: CloudMetrics = {
    provider: 'Azure',
    subscriptions: 1, // Simplified
    services: ['VM', 'Storage', 'SQL Database']
  };

  return metrics;
};

const getGCPMetrics = async (credentials: CloudProviderCredentials, _timeframe: string): Promise<CloudMetrics> => {
  // GCP monitoring
  const monitoring = new MetricServiceClient();

  const metrics: CloudMetrics = {
    provider: 'GCP',
    projects: 1, // Simplified
    services: ['Compute Engine', 'Cloud Storage', 'Cloud SQL'],
    status: 'connected'
  };

  // Real implementation would query GCP Monitoring API with credentials
  await monitoring.listMetricDescriptors({
    name: `projects/${credentials.projectId || 'your-project-id'}`
  });

  return metrics;
};

export const getCloudResources = async (provider: string, type?: string): Promise<CloudResource[]> => {
  try {
    const providerData = await pool.query(
      'SELECT * FROM cloud_providers WHERE name = $1 AND status = $2',
      [provider, 'connected']
    );

    if (providerData.rows.length === 0) {
      return [];
    }

    // Simplified resource listing
    const resources = [
      { id: 'res-1', type: 'VM', name: 'web-server-01', status: 'running' },
      { id: 'res-2', type: 'Database', name: 'prod-db', status: 'running' },
      { id: 'res-3', type: 'Storage', name: 'data-bucket', status: 'active' }
    ];

    return type ? resources.filter(r => r.type === type) : resources;
  } catch (error) {
    logger.error(`Error fetching ${provider} resources:`, error);
    throw error;
  }
};
