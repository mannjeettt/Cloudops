import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Container } from "lucide-react";
import { Progress } from "./ui/progress";

interface ContainerItem {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

export const ContainerStats = () => {
  const [containers, setContainers] = React.useState<ContainerItem[]>([]);

  React.useEffect(() => {
    const loadContainers = async () => {
      try {
        const response = await fetch("/api/containers");
        if (!response.ok) {
          throw new Error("Failed to load containers");
        }

        const body = await response.json();
        setContainers(Array.isArray(body.containers) ? body.containers.slice(0, 4) : []);
      } catch (error) {
        console.error("Error loading containers:", error);
        setContainers([]);
      }
    };

    loadContainers();
    const intervalId = window.setInterval(loadContainers, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

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
          {containers.map((container) => (
            <div key={container.id} className="p-4 rounded-lg bg-background border border-border">
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
          {containers.length === 0 && (
            <p className="text-sm text-muted-foreground">No containers detected from the current host.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
