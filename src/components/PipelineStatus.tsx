import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle2, XCircle, Clock, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const pipelines = [
  { name: "Production Deploy", status: "success", branch: "main", time: "2m ago" },
  { name: "Staging Build", status: "running", branch: "develop", time: "Running..." },
  { name: "Feature/Auth", status: "success", branch: "feature/auth", time: "15m ago" },
  { name: "Hotfix/Critical", status: "failed", branch: "hotfix/critical", time: "1h ago" },
];

export const PipelineStatus = () => {
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
          {pipelines.map((pipeline, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {pipeline.status === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                )}
                {pipeline.status === "failed" && (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                {pipeline.status === "running" && (
                  <Clock className="w-5 h-5 text-warning animate-pulse" />
                )}
                <div>
                  <p className="font-medium text-foreground">{pipeline.name}</p>
                  <p className="text-xs text-muted-foreground">{pipeline.branch}</p>
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium px-3 py-1 rounded-full",
                pipeline.status === "success" && "bg-success/10 text-success",
                pipeline.status === "failed" && "bg-destructive/10 text-destructive",
                pipeline.status === "running" && "bg-warning/10 text-warning"
              )}>
                {pipeline.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
