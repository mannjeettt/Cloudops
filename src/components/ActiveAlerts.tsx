import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  service: string;
  createdAt?: string;
}

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
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);

  React.useEffect(() => {
    const loadAlerts = async () => {
      try {
        const response = await fetch("/api/alerts/active");
        if (!response.ok) {
          throw new Error("Failed to load alerts");
        }

        const body = await response.json();
        setAlerts(Array.isArray(body.alerts) ? body.alerts.slice(0, 5) : []);
      } catch (error) {
        console.error("Error loading alerts:", error);
        setAlerts([]);
      }
    };

    loadAlerts();
    const intervalId = window.setInterval(loadAlerts, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

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
          {alerts.map((alert) => (
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
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground">No active alerts right now.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
