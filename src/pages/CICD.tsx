import { CheckCircle2, Clock, Filter, GitBranch, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { PipelineStatus } from "@/components/PipelineStatus";
import { useDeploymentHistoryQuery, usePipelinesQuery } from "@/hooks/use-cloudops-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDuration(duration?: number | string | null) {
  if (duration == null) {
    return "In progress";
  }

  const totalSeconds = typeof duration === "string" ? Number(duration) : duration;
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "In progress";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds}s`;
}

function formatRelativeTime(timestamp?: string) {
  if (!timestamp) {
    return "Queued";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffMinutes < 1440) {
    return `${Math.round(diffMinutes / 60)}h ago`;
  }

  return `${Math.round(diffMinutes / 1440)}d ago`;
}

const CICD = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const { data: pipelineResponse } = usePipelinesQuery(selectedProvider === "all" ? undefined : { provider: selectedProvider });
  const pipelines = pipelineResponse?.pipelines || [];
  const { data: deploymentHistory = [], isLoading: isDeploymentsLoading } = useDeploymentHistoryQuery(8);
  const availableProviders = useMemo(
    () => ["all", ...new Set(pipelines.map((pipeline) => pipeline.provider).filter(Boolean) as string[])],
    [pipelines],
  );

  const totalBuilds = deploymentHistory.length;
  const successfulBuilds = deploymentHistory.filter((deployment) => deployment.status === "success").length;
  const successRate = totalBuilds > 0 ? (successfulBuilds / totalBuilds) * 100 : 0;
  const completedDurations = deploymentHistory
    .map((deployment) => Number(deployment.duration))
    .filter((duration) => Number.isFinite(duration) && duration > 0);
  const averageDurationSeconds = completedDurations.length > 0
    ? Math.round(completedDurations.reduce((sum, duration) => sum + duration, 0) / completedDurations.length)
    : 0;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">CI/CD Pipelines</h2>
        <p className="text-muted-foreground">Continuous integration and deployment automation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Builds</p>
                <p className="text-3xl font-bold">{pipelineResponse?.summary.total || totalBuilds || pipelines.length}</p>
              </div>
              <GitBranch className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-success">
                  {pipelineResponse?.summary.total
                    ? ((pipelineResponse.summary.success / Math.max(pipelineResponse.summary.total, 1)) * 100).toFixed(1)
                    : successRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Duration</p>
                <p className="text-3xl font-bold">{formatDuration(averageDurationSeconds)}</p>
              </div>
              <Clock className="w-10 h-10 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-border bg-card">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Pipeline source
          </div>
          {availableProviders.map((provider) => (
            <Button
              key={provider}
              type="button"
              size="sm"
              variant={selectedProvider === provider ? "default" : "outline"}
              onClick={() => setSelectedProvider(provider)}
            >
              {provider === "all" ? "All sources" : provider}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineStatus />

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Deployment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isDeploymentsLoading && (
                <div className="space-y-3">
                  <div className="h-16 rounded-lg border border-border bg-background animate-pulse" />
                  <div className="h-16 rounded-lg border border-border bg-background animate-pulse" />
                </div>
              )}

              {deploymentHistory.map((deployment) => (
                <div
                  key={String(deployment.id ?? deployment.pipeline_id ?? `${deployment.name}-${deployment.created_at ?? deployment.startedAt ?? deployment.branch ?? "latest"}`)}
                  className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {deployment.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{deployment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(deployment.duration)} | {formatRelativeTime(deployment.created_at ?? deployment.startedAt)}
                        {deployment.provider ? ` | ${deployment.provider}` : ""}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Logs</Button>
                </div>
              ))}

              {!isDeploymentsLoading && deploymentHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No deployment history available yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CICD;
