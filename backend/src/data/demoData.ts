const now = Date.now();

const minutesAgo = (minutes: number): string => new Date(now - minutes * 60 * 1000).toISOString();

export const demoAlerts = [
  {
    id: 'a1',
    title: 'High CPU Usage',
    message: 'CPU usage crossed 88% on api-gateway',
    severity: 'critical',
    service: 'api-gateway',
    status: 'active',
    createdAt: minutesAgo(6)
  },
  {
    id: 'a2',
    title: 'Memory Pressure',
    message: 'Memory usage reached 76% on worker-cluster',
    severity: 'warning',
    service: 'worker-cluster',
    status: 'active',
    createdAt: minutesAgo(18)
  },
  {
    id: 'a3',
    title: 'Deployment Notice',
    message: 'Frontend deployment completed successfully',
    severity: 'info',
    service: 'frontend',
    status: 'resolved',
    createdAt: minutesAgo(75),
    resolvedAt: minutesAgo(42)
  }
];

export const demoContainers = [
  { id: 'c1', name: 'api-gateway', cpu: 68, memory: 72, status: 'running' },
  { id: 'c2', name: 'worker-cluster', cpu: 54, memory: 61, status: 'running' },
  { id: 'c3', name: 'postgres-db', cpu: 31, memory: 48, status: 'running' },
  { id: 'c4', name: 'redis-cache', cpu: 19, memory: 28, status: 'running' }
];

export const demoPipelines = [
  { id: 'p1', name: 'Frontend Build', status: 'success', branch: 'main', startedAt: minutesAgo(20) },
  { id: 'p2', name: 'Backend API Tests', status: 'running', branch: 'develop', startedAt: minutesAgo(4) },
  { id: 'p3', name: 'Docker Image Publish', status: 'pending', branch: 'release/v2.4', startedAt: minutesAgo(1) },
  { id: 'p4', name: 'Smoke Tests', status: 'failed', branch: 'main', startedAt: minutesAgo(55) }
];

export const demoMetricsHistory = {
  cpu: [72, 75, 69, 81, 78, 74, 83, 79, 76, 71, 73, 77].map((value, index) => ({
    value,
    created_at: minutesAgo((11 - index) * 5)
  })),
  memory: [58, 60, 59, 61, 64, 63, 65, 66, 64, 62, 61, 63].map((value, index) => ({
    value,
    created_at: minutesAgo((11 - index) * 5)
  }))
};

export const demoMetricsSummary = [
  { metric_type: 'cpu', average: 75, min: 69, max: 83, count: 12 },
  { metric_type: 'memory', average: 62, min: 58, max: 66, count: 12 },
  { metric_type: 'disk', average: 57, min: 57, max: 57, count: 12 }
];

export const demoCloudProviders = [
  { name: 'aws', status: 'connected', region: 'ap-south-1' },
  { name: 'azure', status: 'connected', region: 'central-india' },
  { name: 'gcp', status: 'disconnected', region: 'asia-south1' }
];

export const demoCloudMetrics = [
  { provider: 'aws', service: 'EC2', usage: 72, timeframe: '1h' },
  { provider: 'azure', service: 'VM', usage: 64, timeframe: '1h' },
  { provider: 'gcp', service: 'GKE', usage: 51, timeframe: '1h' }
];

export const demoCloudResources = [
  { id: 'r1', provider: 'aws', type: 'vm', name: 'prod-api-01', status: 'running' },
  { id: 'r2', provider: 'azure', type: 'database', name: 'analytics-db', status: 'healthy' },
  { id: 'r3', provider: 'gcp', type: 'cluster', name: 'edge-cluster', status: 'standby' }
];
