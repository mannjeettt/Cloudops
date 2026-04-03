import { useMutation, useQueries, useQuery } from "@tanstack/react-query";

import { fetchJson, REFRESH_INTERVAL_MS } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  title?: string;
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
  finishedAt?: string;
  duration?: number;
  source?: string;
  provider?: "database" | "github" | "gitlab" | "jenkins";
  url?: string;
}

export interface PipelineSummary {
  total: number;
  running: number;
  success: number;
  failed: number;
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
  source?: string;
  provider?: Pipeline["provider"];
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
  metric_type?: string;
  average?: string | number;
  min?: string | number;
  max?: string | number;
  count?: string | number;
}

export interface MetricsHistoryPoint {
  value: string | number;
  created_at: string;
}

export interface SettingsResponse {
  profile: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  preferences: {
    notifications: boolean;
    theme: string;
    timezone: string;
    email_alerts: boolean;
    dashboard_refresh_interval: number;
  };
  systemSettings: {
    maintenance_mode: boolean;
    max_users: number;
    data_retention_days: number;
    backup_frequency: string;
  } | null;
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

export function usePipelinesQuery(filters?: { provider?: string; source?: string }) {
  const search = new URLSearchParams();

  if (filters?.provider) {
    search.set("provider", filters.provider);
  }

  if (filters?.source) {
    search.set("source", filters.source);
  }

  return useQuery({
    queryKey: ["pipelines", filters],
    queryFn: async () => {
      const body = await fetchJson<{ pipelines?: Pipeline[]; summary?: PipelineSummary }>(`/api/pipelines${search.size ? `?${search.toString()}` : ""}`);
      return {
        pipelines: Array.isArray(body.pipelines) ? body.pipelines : [],
        summary: body.summary || { total: 0, running: 0, success: 0, failed: 0 },
      };
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

export function useMetricHistoryQueries(timeframe: string = "1h", metrics: string[] = ["cpu", "memory", "disk"]) {
  return useQueries({
    queries: metrics.map((metric) => ({
      queryKey: ["metrics", "history", metric, timeframe],
      queryFn: async () => {
        const body = await fetchJson<{ metrics?: MetricsHistoryPoint[] }>(`/api/metrics/history?metric=${metric}&timeframe=${timeframe}`);
        return Array.isArray(body.metrics) ? body.metrics : [];
      },
      refetchInterval: REFRESH_INTERVAL_MS,
    })),
  });
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchJson<SettingsResponse>("/api/settings"),
  });
}

export function useUpdateSettingsMutation() {
  return useMutation({
    mutationFn: (payload: Pick<SettingsResponse, "profile" | "preferences">) =>
      fetchJson("/api/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateSystemSettingsMutation() {
  return useMutation({
    mutationFn: (payload: NonNullable<SettingsResponse["systemSettings"]>) =>
      fetchJson("/api/settings/system", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
