import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveAlertsQuery } from "@/hooks/use-cloudops-queries";

function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) {
    return "Just now";
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

export const ActiveAlerts = () => {
  const { data: alerts = [], isLoading, isError } = useActiveAlertsQuery();
  const visibleAlerts = alerts.slice(0, 5);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Active Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading && (
            <div className="space-y-3">
              <div className="h-20 rounded-lg border border-border bg-background animate-pulse" />
              <div className="h-20 rounded-lg border border-border bg-background animate-pulse" />
            </div>
          )}
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border",
                alert.severity === "critical" && "bg-destructive/5 border-destructive/30",
                alert.severity === "warning" && "bg-warning/5 border-warning/30",
                alert.severity === "info" && "bg-primary/5 border-primary/30"
              )}
            >
              {alert.severity === "critical" && <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />}
              {alert.severity === "warning" && <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />}
              {alert.severity === "info" && <Info className="w-5 h-5 text-primary mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{alert.service}</span>
                  <span className="text-xs text-muted-foreground">&bull;</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(alert.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
          {isError && (
            <p className="text-sm text-destructive">Unable to load active alerts right now.</p>
          )}
          {!isLoading && !isError && visibleAlerts.length === 0 && (
            <p className="text-sm text-muted-foreground">No active alerts right now.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
