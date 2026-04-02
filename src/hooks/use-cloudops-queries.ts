import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchJson, REFRESH_INTERVAL_MS } from "@/lib/api";

export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  service: string;
  createdAt?: string;
  status?: "active" | "resolved";
  resolvedAt?: string;
}

export interface AlertStatsResponse {
  stats?: {
    total?: number;
    critical?: number;
    warning?: number;
    info?: number;
  };
}

export interface ContainerItem {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

export interface Pipeline {
  id: string;
  name: string;
  status: "success" | "failed" | "running" | "pending";
  branch: string;
  startedAt?: string;
}

export interface DeploymentHistoryItem {
  id?: string | number;
  pipeline_id?: string;
  name: string;
  status: "success" | "failed" | "running" | "pending";
  branch?: string;
  startedAt?: string;
  created_at?: string;
  duration?: number | string | null;
}

export interface MetricsResponse {
  metrics?: {
    cpu?: number;
    memory?: {
      percentage?: number;
    };
    disk?: {
      percentage?: number;
    };
    network?: {
      rx?: number;
      tx?: number;
    };
  };
}

export interface MetricsSummaryRow {
  count?: string | number;
}

export interface MetricsHistoryPoint {
  value: string | number;
  created_at: string;
}

export function useActiveAlertsQuery() {
  return useQuery({
    queryKey: ["alerts", "active"],
    queryFn: async () => {
      const body = await fetchJson<{ alerts?: AlertItem[] }>("/api/alerts/active");
      return Array.isArray(body.alerts) ? body.alerts : [];
    },
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useAlertStatsQuery() {
  return useQuery({
    queryKey: ["alerts", "stats"],
    queryFn: () => fetchJson<AlertStatsResponse>("/api/alerts/stats"),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useAlertHistoryQuery(limit: number = 100) {
  return useQuery({
    queryKey: ["alerts", "history", limit],
    queryFn: async () => {
      const body = await fetchJson<{ alerts?: AlertItem[] }>(`/api/alerts/history?limit=${limit}`);
      return Array.isArray(body.alerts) ? body.alerts : [];
    },
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useContainersQuery() {
  return useQuery({
    queryKey: ["containers"],
    queryFn: async () => {
      const body = await fetchJson<{ containers?: ContainerItem[] }>("/api/containers");
      return Array.isArray(body.containers) ? body.containers : [];
    },
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function usePipelinesQuery() {
  return useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const body = await fetchJson<{ pipelines?: Pipeline[] }>("/api/pipelines");
      return Array.isArray(body.pipelines) ? body.pipelines : [];
    },
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useDeploymentHistoryQuery(limit: number = 20) {
  return useQuery({
    queryKey: ["pipelines", "deployments", limit],
    queryFn: async () => {
      const body = await fetchJson<{ deployments?: DeploymentHistoryItem[] }>(`/api/pipelines/deployments/history?limit=${limit}`);
      return Array.isArray(body.deployments) ? body.deployments : [];
    },
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useCurrentMetricsQuery() {
  return useQuery({
    queryKey: ["metrics", "current"],
    queryFn: () => fetchJson<MetricsResponse>("/api/metrics/current"),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useMetricsSummaryQuery() {
  return useQuery({
    queryKey: ["metrics", "summary"],
    queryFn: async () => {
      const body = await fetchJson<{ summary?: MetricsSummaryRow[] }>("/api/metrics/summary");
      return Array.isArray(body.summary) ? body.summary : [];
    },
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useMetricHistoryQueries(timeframe: string = "1h") {
  return useQueries({
    queries: [
      {
        queryKey: ["metrics", "history", "cpu", timeframe],
        queryFn: async () => {
          const body = await fetchJson<{ metrics?: MetricsHistoryPoint[] }>(`/api/metrics/history?metric=cpu&timeframe=${timeframe}`);
          return Array.isArray(body.metrics) ? body.metrics : [];
        },
        refetchInterval: REFRESH_INTERVAL_MS,
      },
      {
        queryKey: ["metrics", "history", "memory", timeframe],
        queryFn: async () => {
          const body = await fetchJson<{ metrics?: MetricsHistoryPoint[] }>(`/api/metrics/history?metric=memory&timeframe=${timeframe}`);
          return Array.isArray(body.metrics) ? body.metrics : [];
        },
        refetchInterval: REFRESH_INTERVAL_MS,
      },
    ],
  });
}
