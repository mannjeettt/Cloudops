import AWS from 'aws-sdk';
import { ClientSecretCredential, DefaultAzureCredential } from '@azure/identity';
import { MetricsQueryClient, type AggregationType, type MetricValue } from '@azure/monitor-query';
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
  clientId?: string;
  clientSecret?: string;
  metricNames?: string[];
  resourceId?: string;
  resourceIds?: string[];
  subscriptionId?: string;
  tenantId?: string;
}

type CloudMetrics = {
  provider: 'AWS' | 'Azure' | 'GCP';
  services: string[];
  instances?: number;
  subscriptions?: number;
  projects?: number;
  region?: string;
  status?: 'connected';
  metrics?: CloudMetricSummary[];
  monitoredResources?: number;
  resourceIds?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
};

type CloudMetricSummary = {
  name: string;
  namespace?: string;
  resourceId?: string;
  average?: number;
  maximum?: number;
  total?: number;
  latest?: number;
  samples: number;
  unit?: string;
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

const parseTimeframe = (timeframe: string): number => {
  const match = /^(\d+)([mhd])$/.exec(timeframe.trim().toLowerCase());

  if (!match) {
    return 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === 'm') {
    return amount * 60 * 1000;
  }

  if (unit === 'h') {
    return amount * 60 * 60 * 1000;
  }

  return amount * 24 * 60 * 60 * 1000;
};

const getMetricWindow = (timeframe: string) => {
  const end = new Date();
  const start = new Date(end.getTime() - parseTimeframe(timeframe));

  return { start, end };
};

const getMetricPeriodSeconds = (timeframe: string): number => {
  const minutes = parseTimeframe(timeframe) / 60000;

  if (minutes <= 60) {
    return 300;
  }

  if (minutes <= 24 * 60) {
    return 900;
  }

  return 3600;
};

const average = (values: number[]): number | undefined => {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const sum = (values: number[]): number | undefined => {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((total, value) => total + value, 0);
};

const toMetricSummary = (
  name: string,
  values: number[],
  options: Pick<CloudMetricSummary, 'namespace' | 'resourceId' | 'unit'> = {}
): CloudMetricSummary => ({
  name,
  ...options,
  average: average(values),
  maximum: values.length > 0 ? Math.max(...values) : undefined,
  total: sum(values),
  latest: values.at(-1),
  samples: values.length
});

const getAzureResourceIds = (credentials: CloudProviderCredentials): string[] => {
  const configuredIds = [
    ...(credentials.resourceIds ?? []),
    ...(credentials.resourceId ? credentials.resourceId.split(',') : [])
  ];

  return [...new Set(configuredIds.map((id) => id.trim()).filter(Boolean))];
};

const getAzureSubscriptionId = (resourceId: string): string | undefined => {
  return /\/subscriptions\/([^/]+)/i.exec(resourceId)?.[1];
};

const getAzureServiceName = (resourceId: string): string => {
  return /\/providers\/([^/]+\/[^/]+)/i.exec(resourceId)?.[1] ?? 'Azure Monitor';
};

const getAzureCredential = (credentials: CloudProviderCredentials) => {
  const clientId = credentials.clientId ?? credentials.apiKey;
  const clientSecret = credentials.clientSecret ?? credentials.secretKey;

  if (credentials.tenantId && clientId && clientSecret) {
    return new ClientSecretCredential(credentials.tenantId, clientId, clientSecret);
  }

  return new DefaultAzureCredential();
};

const collectAwsNamespaces = async (cloudwatch: AWS.CloudWatch): Promise<string[]> => {
  const namespaces = new Set<string>();
  let nextToken: string | undefined;

  do {
    const response = await cloudwatch.listMetrics({
      NextToken: nextToken,
      RecentlyActive: 'PT3H'
    }).promise();

    response.Metrics?.forEach((metric) => {
      if (metric.Namespace) {
        namespaces.add(metric.Namespace.replace(/^AWS\//, ''));
      }
    });
    nextToken = response.NextToken;
  } while (nextToken && namespaces.size < 25);

  return [...namespaces].sort();
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
  credentials: CloudProviderCredentials
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

const getAWSMetrics = async (credentials: CloudProviderCredentials, timeframe: string): Promise<CloudMetrics> => {
  // Configure AWS SDK
  AWS.config.update({
    accessKeyId: credentials.apiKey,
    secretAccessKey: credentials.secretKey,
    region: credentials.region || 'us-east-1'
  });

  const ec2 = new AWS.EC2();
  const cloudwatch = new AWS.CloudWatch();
  const instances = await ec2.describeInstances().promise();
  const instanceIds = instances.Reservations
    ?.flatMap((reservation) => reservation.Instances ?? [])
    .map((instance) => instance.InstanceId)
    .filter((id): id is string => Boolean(id)) ?? [];
  const { start, end } = getMetricWindow(timeframe);
  const period = getMetricPeriodSeconds(timeframe);
  const metricNames = ['CPUUtilization', 'NetworkIn', 'NetworkOut'];
  const metricQueries: AWS.CloudWatch.MetricDataQuery[] = instanceIds.slice(0, 150).flatMap((instanceId, instanceIndex) =>
    metricNames.map((metricName, metricIndex) => ({
      Id: `m${instanceIndex}_${metricIndex}`,
      Label: `${instanceId} ${metricName}`,
      MetricStat: {
        Metric: {
          Namespace: 'AWS/EC2',
          MetricName: metricName,
          Dimensions: [{ Name: 'InstanceId', Value: instanceId }]
        },
        Period: period,
        Stat: metricName === 'CPUUtilization' ? 'Average' : 'Sum'
      },
      ReturnData: true
    }))
  );
  const cloudWatchResults = metricQueries.length > 0
    ? await cloudwatch.getMetricData({
      StartTime: start,
      EndTime: end,
      MetricDataQueries: metricQueries
    }).promise()
    : { MetricDataResults: [] };
  const metricSummaries = metricNames.map((metricName) => {
    const values = cloudWatchResults.MetricDataResults
      ?.filter((result) => result.Label?.endsWith(metricName))
      .flatMap((result) => result.Values ?? []) ?? [];

    return toMetricSummary(metricName, values, {
      namespace: 'AWS/EC2',
      unit: metricName === 'CPUUtilization' ? 'Percent' : 'Bytes'
    });
  });
  const services = await collectAwsNamespaces(cloudwatch);

  return {
    provider: 'AWS',
    instances: instanceIds.length,
    region: credentials.region,
    services: services.length > 0 ? services : ['EC2'],
    metrics: metricSummaries,
    monitoredResources: instanceIds.length,
    timeRange: {
      start: start.toISOString(),
      end: end.toISOString()
    }
  };
};

const getAzureMetrics = async (credentials: CloudProviderCredentials, timeframe: string): Promise<CloudMetrics> => {
  const resourceIds = getAzureResourceIds(credentials);

  if (resourceIds.length === 0) {
    throw new Error('Azure Monitor metrics require credentials.resourceId or credentials.resourceIds to be configured');
  }

  const credential = getAzureCredential(credentials);
  const metricsClient = new MetricsQueryClient(credential);
  const { start, end } = getMetricWindow(timeframe);
  const preferredMetricNames = credentials.metricNames ?? [
    'Percentage CPU',
    'Network In Total',
    'Network Out Total',
    'UsedCapacity',
    'CpuPercentage',
    'Data IO Percentage'
  ];
  const metricSummaries: CloudMetricSummary[] = [];

  for (const resourceId of resourceIds) {
    const definitions = [];

    for await (const definition of metricsClient.listMetricDefinitions(resourceId)) {
      definitions.push(definition);
      if (definitions.length >= 100) {
        break;
      }
    }

    const availableNames = new Set(definitions.map((definition) => definition.name).filter((name): name is string => Boolean(name)));
    const metricNames = preferredMetricNames.filter((metricName) => availableNames.has(metricName));

    if (metricNames.length === 0) {
      continue;
    }

    const response = await metricsClient.queryResource(resourceId, metricNames, {
      timespan: { startTime: start, endTime: end },
      granularity: periodToIsoDuration(getMetricPeriodSeconds(timeframe)),
      aggregations: ['Average', 'Maximum', 'Total'] as AggregationType[],
      autoAdjustTimegrain: true
    });

    for (const metric of response.metrics) {
      const values = metric.timeseries.flatMap((series) => series.data ?? []);
      metricSummaries.push(toAzureMetricSummary(metric.name, values, {
        namespace: response.namespace,
        resourceId: response.resourceId ?? resourceId,
        unit: metric.unit
      }));
    }
  }

  const subscriptions = new Set(resourceIds.map(getAzureSubscriptionId).filter(Boolean));

  return {
    provider: 'Azure',
    subscriptions: subscriptions.size || (credentials.subscriptionId ? 1 : undefined),
    services: [...new Set(resourceIds.map(getAzureServiceName))].sort(),
    metrics: metricSummaries,
    monitoredResources: resourceIds.length,
    resourceIds,
    timeRange: {
      start: start.toISOString(),
      end: end.toISOString()
    }
  };
};

const periodToIsoDuration = (periodSeconds: number): string => `PT${periodSeconds}S`;

const toAzureMetricSummary = (
  name: string,
  values: MetricValue[],
  options: Pick<CloudMetricSummary, 'namespace' | 'resourceId' | 'unit'>
): CloudMetricSummary => {
  const averages = values.map((value) => value.average).filter((value): value is number => typeof value === 'number');
  const maximums = values.map((value) => value.maximum).filter((value): value is number => typeof value === 'number');
  const totals = values.map((value) => value.total).filter((value): value is number => typeof value === 'number');
  const latest = [...averages, ...totals].at(-1);

  return {
    name,
    ...options,
    average: average(averages),
    maximum: maximums.length > 0 ? Math.max(...maximums) : undefined,
    total: sum(totals),
    latest,
    samples: values.length
  };
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
