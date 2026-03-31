import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Container } from "lucide-react";
import { Progress } from "./ui/progress";
import { useContainersQuery } from "@/hooks/use-cloudops-queries";

export const ContainerStats = () => {
  const { data: containers = [], isLoading, isError } = useContainersQuery();
  const visibleContainers = containers.slice(0, 4);

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
          {isLoading && (
            <div className="space-y-4">
              <div className="h-28 rounded-lg border border-border bg-background animate-pulse" />
              <div className="h-28 rounded-lg border border-border bg-background animate-pulse" />
            </div>
          )}
          {visibleContainers.map((container) => (
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
          {isError && (
            <p className="text-sm text-destructive">Unable to load container stats right now.</p>
          )}
          {!isLoading && !isError && visibleContainers.length === 0 && (
            <p className="text-sm text-muted-foreground">No containers detected from the current host.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
