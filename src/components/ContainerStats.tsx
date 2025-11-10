import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Container } from "lucide-react";
import { Progress } from "./ui/progress";

const containers = [
  { name: "api-gateway", cpu: 45, memory: 62, status: "running" },
  { name: "auth-service", cpu: 28, memory: 41, status: "running" },
  { name: "db-primary", cpu: 72, memory: 85, status: "running" },
  { name: "redis-cache", cpu: 15, memory: 32, status: "running" },
];

export const ContainerStats = () => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Container className="w-5 h-5 text-primary" />
          Container Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {containers.map((container, index) => (
            <div key={index} className="p-4 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="font-medium text-foreground">{container.name}</span>
                </div>
                <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                  {container.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">CPU</span>
                    <span className="text-foreground font-medium">{container.cpu}%</span>
                  </div>
                  <Progress value={container.cpu} className="h-1.5" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Memory</span>
                    <span className="text-foreground font-medium">{container.memory}%</span>
                  </div>
                  <Progress value={container.memory} className="h-1.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
