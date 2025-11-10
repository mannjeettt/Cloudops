import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alerts = [
  { 
    severity: "critical", 
    message: "High memory usage on prod-server-01", 
    service: "Production API",
    time: "2m ago" 
  },
  { 
    severity: "warning", 
    message: "Slow response time detected", 
    service: "Database Cluster",
    time: "15m ago" 
  },
  { 
    severity: "info", 
    message: "Deployment completed successfully", 
    service: "CI/CD Pipeline",
    time: "1h ago" 
  },
];

export const ActiveAlerts = () => {
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
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border",
                alert.severity === "critical" && "bg-destructive/5 border-destructive/30",
                alert.severity === "warning" && "bg-warning/5 border-warning/30",
                alert.severity === "info" && "bg-primary/5 border-primary/30"
              )}
            >
              {alert.severity === "critical" && (
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              )}
              {alert.severity === "warning" && (
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              )}
              {alert.severity === "info" && (
                <Info className="w-5 h-5 text-primary mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{alert.service}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
