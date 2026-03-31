import React from "react";
import { Activity, AlertCircle, AlertTriangle, Bell, GitBranch, HardDrive } from "lucide-react";

import { ActiveAlerts } from "@/components/ActiveAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAlertHistoryQuery,
  useAlertStatsQuery,
  useCurrentMetricsQuery,
  usePipelinesQuery,
} from "@/hooks/use-cloudops-queries";
import { cn } from "@/lib/utils";

interface RuleCard {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "critical" | "muted";
  detail: string;
  icon: typeof Activity;
}

function isToday(timestamp?: string): boolean {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const Alerts = () => {
  const { data: alertStats, isLoading: isStatsLoading } = useAlertStatsQuery();
  const { data: alertHistory = [], isLoading: isHistoryLoading } = useAlertHistoryQuery(100);
  const { data: currentMetrics, isLoading: isMetricsLoading } = useCurrentMetricsQuery();
  const { data: pipelines = [], isLoading: isPipelinesLoading } = usePipelinesQuery();

  const cpuUsage = Math.round(currentMetrics?.metrics?.cpu || 0);
  const memoryUsage = Math.round(currentMetrics?.metrics?.memory?.percentage || 0);
  const failedPipelines = pipelines.filter((pipeline) => pipeline.status === "failed").length;

  const summary = {
    critical: Number(alertStats?.stats?.critical || 0),
    warnings: Number(alertStats?.stats?.warning || 0),
    resolvedToday: alertHistory.filter((alert) => alert.status === "resolved" && isToday(alert.resolvedAt)).length,
  };

  const rules: RuleCard[] = [
    {
      id: "cpu-threshold",
      title: "CPU Threshold",
      description: "Live signal based on whether CPU usage is approaching or crossing the alert threshold.",
      statusLabel: cpuUsage > 90 ? "Triggered" : cpuUsage > 80 ? "Warning" : "Monitoring",
      statusTone: cpuUsage > 90 ? "critical" : cpuUsage > 80 ? "warning" : "success",
      detail: `Current CPU: ${cpuUsage}%`,
      icon: Activity,
    },
    {
      id: "memory-alert",
      title: "Memory Alert",
      description: "Live signal based on whether memory usage is crossing the critical threshold.",
      statusLabel: memoryUsage > 90 ? "Triggered" : "Monitoring",
      statusTone: memoryUsage > 90 ? "critical" : "success",
      detail: `Current memory: ${memoryUsage}%`,
      icon: HardDrive,
    },
    {
      id: "pipeline-failures",
      title: "Pipeline Failures",
      description: "Live signal based on the latest CI/CD pipeline outcomes.",
      statusLabel: failedPipelines > 0 ? "Attention" : "Healthy",
      statusTone: failedPipelines > 0 ? "warning" : "success",
      detail: failedPipelines > 0 ? `${failedPipelines} failed pipeline${failedPipelines === 1 ? "" : "s"}` : "No failed pipelines",
      icon: GitBranch,
    },
  ];

  const isLoading = isStatsLoading || isHistoryLoading || isMetricsLoading || isPipelinesLoading;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Alerts & Incidents</h2>
          <p className="text-muted-foreground">Monitor and manage system alerts</p>
        </div>
        <Button className="bg-primary text-primary-foreground" disabled title="Rule management UI is not available yet">
          <Bell className="w-4 h-4 mr-2" />
          Rule Management Soon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Critical</p>
                <p className="text-3xl font-bold text-destructive">
                  {isLoading ? <span className="inline-block h-9 w-10 animate-pulse rounded bg-muted align-middle" /> : summary.critical}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Warnings</p>
                <p className="text-3xl font-bold text-warning">
                  {isLoading ? <span className="inline-block h-9 w-10 animate-pulse rounded bg-muted align-middle" /> : summary.warnings}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved Today</p>
                <p className="text-3xl font-bold text-success">
                  {isLoading ? <span className="inline-block h-9 w-10 animate-pulse rounded bg-muted align-middle" /> : summary.resolvedToday}
                </p>
              </div>
              <Bell className="w-10 h-10 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveAlerts />

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Live Signal Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              These cards reflect current alert-driving signals from live metrics and pipeline data.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading && (
                <>
                  <div className="p-4 bg-background border border-border rounded-lg animate-pulse">
                    <div className="h-4 w-40 rounded bg-muted mb-3" />
                    <div className="h-3 w-full rounded bg-muted mb-2" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg animate-pulse">
                    <div className="h-4 w-36 rounded bg-muted mb-3" />
                    <div className="h-3 w-full rounded bg-muted mb-2" />
                    <div className="h-3 w-28 rounded bg-muted" />
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg animate-pulse">
                    <div className="h-4 w-44 rounded bg-muted mb-3" />
                    <div className="h-3 w-full rounded bg-muted mb-2" />
                    <div className="h-3 w-32 rounded bg-muted" />
                  </div>
                </>
              )}
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <rule.icon className="w-4 h-4 text-primary" />
                      <h3 className="font-medium">{rule.title}</h3>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        rule.statusTone === "success" && "bg-success/10 text-success",
                        rule.statusTone === "warning" && "bg-warning/10 text-warning",
                        rule.statusTone === "critical" && "bg-destructive/10 text-destructive",
                        rule.statusTone === "muted" && "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {rule.statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{rule.detail}</p>
                </div>
              ))}
              {!isLoading && rules.length === 0 && (
                <p className="text-sm text-muted-foreground">Alert rules are unavailable right now.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Alerts;
