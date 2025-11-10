import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
  status?: "success" | "warning" | "error";
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  status = "success" 
}: MetricCardProps) => {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium",
                status === "success" && "text-success",
                status === "warning" && "text-warning",
                status === "error" && "text-destructive"
              )}>
                {trend === "up" ? "↑" : "↓"} {change}
              </span>
              <span className="text-xs text-muted-foreground">vs last hour</span>
            </div>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            status === "success" && "bg-success/10",
            status === "warning" && "bg-warning/10",
            status === "error" && "bg-destructive/10"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              status === "success" && "text-success",
              status === "warning" && "text-warning",
              status === "error" && "text-destructive"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
