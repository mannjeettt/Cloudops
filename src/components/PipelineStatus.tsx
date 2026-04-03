import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle2, XCircle, Clock, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePipelinesQuery } from "@/hooks/use-cloudops-queries";

function formatRelativeTime(timestamp?: string): string {
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

  return `${Math.round(diffMinutes / 60)}h ago`;
}

export const PipelineStatus = () => {
  const { data, isLoading, isError } = usePipelinesQuery();
  const visiblePipelines = (data?.pipelines || []).slice(0, 4);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          CI/CD Pipelines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading && (
            <div className="space-y-3">
              <div className="h-16 rounded-lg border border-border bg-background animate-pulse" />
              <div className="h-16 rounded-lg border border-border bg-background animate-pulse" />
            </div>
          )}
          {visiblePipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {pipeline.status === "success" && <CheckCircle2 className="w-5 h-5 text-success" />}
                {pipeline.status === "failed" && <XCircle className="w-5 h-5 text-destructive" />}
                {pipeline.status === "running" && <Clock className="w-5 h-5 text-warning animate-pulse" />}
                {pipeline.status === "pending" && <Clock className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <p className="font-medium text-foreground">{pipeline.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pipeline.branch}
                    {pipeline.source ? ` • ${pipeline.source}` : ""}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-xs font-medium px-3 py-1 rounded-full",
                  pipeline.status === "success" && "bg-success/10 text-success",
                  pipeline.status === "failed" && "bg-destructive/10 text-destructive",
                  pipeline.status === "running" && "bg-warning/10 text-warning",
                  pipeline.status === "pending" && "bg-muted text-muted-foreground"
                )}
              >
                {pipeline.status === "running" ? "Running..." : formatRelativeTime(pipeline.startedAt)}
              </span>
            </div>
          ))}
          {isError && (
            <p className="text-sm text-destructive">Unable to load pipeline status right now.</p>
          )}
          {!isLoading && !isError && visiblePipelines.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent pipelines available yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
