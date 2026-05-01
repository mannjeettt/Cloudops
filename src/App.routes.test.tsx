import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ComponentType } from "react";

import { queryClient } from "@/lib/query-client";

const authState = vi.hoisted(() => ({
  user: { id: "1", email: "admin@cloudops.io", name: "Admin User", role: "admin" },
  token: "jwt-token",
  isAuthenticated: true,
  isBootstrapping: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  updateUser: vi.fn(),
}));

const settingsData = vi.hoisted(() => ({
  profile: { id: "1", email: "admin@cloudops.io", name: "Admin User", role: "admin" },
  preferences: { notifications: true, theme: "light", timezone: "UTC", email_alerts: true, dashboard_refresh_interval: 30 },
  systemSettings: { maintenance_mode: false, max_users: 100, data_retention_days: 90, backup_frequency: "daily" },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/components/SystemMetricsChart", () => ({
  SystemMetricsChart: () => <div data-testid="system-metrics-chart" />,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      onClick={() => onCheckedChange?.(!checked)}
    />
  ),
}));

vi.mock("@/hooks/use-cloudops-queries", () => ({
  useActiveAlertsQuery: () => ({
    data: [{ id: "alert-1", severity: "critical", message: "CPU high", service: "api" }],
    isLoading: false,
  }),
  useAlertHistoryQuery: () => ({
    data: [{ id: "alert-2", severity: "info", message: "Resolved", service: "api", status: "resolved", resolvedAt: new Date().toISOString() }],
    isLoading: false,
  }),
  useAlertStatsQuery: () => ({
    data: { stats: { critical: 1, warning: 2, info: 3 } },
    isLoading: false,
  }),
  useContainersQuery: () => ({
    data: [{ id: "container-1", name: "api", cpu: 15, memory: 256, status: "running" }],
    isLoading: false,
  }),
  useCurrentMetricsQuery: () => ({
    data: { metrics: { cpu: 42, memory: { percentage: 55 }, disk: { percentage: 61 }, network: { rx: 1, tx: 2 } } },
    isLoading: false,
  }),
  useDeploymentHistoryQuery: () => ({
    data: [{ id: "deployment-1", name: "deploy-api", status: "success", branch: "main", duration: 120, created_at: new Date().toISOString() }],
    isLoading: false,
  }),
  useMetricHistoryQueries: () => [
    { data: [{ value: 40, created_at: new Date().toISOString() }], isLoading: false },
    { data: [{ value: 55, created_at: new Date().toISOString() }], isLoading: false },
    { data: [{ value: 61, created_at: new Date().toISOString() }], isLoading: false },
  ],
  useMetricsSummaryQuery: () => ({
    data: [
      { metric_type: "cpu", average: 40 },
      { metric_type: "memory", average: 55 },
      { metric_type: "disk", average: 61 },
    ],
    isLoading: false,
  }),
  usePipelinesQuery: () => ({
    data: {
      pipelines: [
        { id: "pipeline-1", name: "deploy-api", status: "running", branch: "main", startedAt: new Date().toISOString(), provider: "github", source: "GitHub" },
      ],
      summary: { total: 1, running: 1, success: 0, failed: 0 },
    },
    isLoading: false,
    isError: false,
  }),
  useSettingsQuery: () => ({
    data: settingsData,
    isLoading: false,
  }),
  useUpdateSettingsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateSystemSettingsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderPageRoute(path: string, Page: ComponentType) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<Page />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("frontend page routes", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it.each([
    ["/", "Dashboard Overview", "@/pages/Index"],
    ["/monitoring", "System Monitoring", "@/pages/Monitoring"],
    ["/containers", "Container Management", "@/pages/Containers"],
    ["/cicd", "CI/CD Pipelines", "@/pages/CICD"],
    ["/alerts", "Alerts & Incidents", "@/pages/Alerts"],
    ["/cloud", "Cloud Services", "@/pages/Cloud"],
    ["/settings", "Settings", "@/pages/Settings"],
  ])("renders %s", async (path, heading, modulePath) => {
    const { default: Page } = await import(modulePath);

    renderPageRoute(path, Page);

    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
  });
});
