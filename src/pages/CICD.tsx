import { CheckCircle2, Clock, GitBranch, XCircle } from "lucide-react";

import { PipelineStatus } from "@/components/PipelineStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CICD = () => {
  const deploymentHistory = [
    { version: "v2.4.1", status: "success", duration: "3m 24s", time: "2 hours ago" },
    { version: "v2.4.0", status: "success", duration: "3m 18s", time: "1 day ago" },
    { version: "v2.3.9", status: "failed", duration: "1m 45s", time: "2 days ago" },
    { version: "v2.3.8", status: "success", duration: "3m 32s", time: "3 days ago" },
  ];

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
                <p className="text-3xl font-bold">1,247</p>
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
                <p className="text-3xl font-bold text-success">94.2%</p>
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
                <p className="text-3xl font-bold">3m 21s</p>
              </div>
              <Clock className="w-10 h-10 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineStatus />

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Deployment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deploymentHistory.map((deployment) => (
                <div key={deployment.version} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {deployment.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{deployment.version}</p>
                      <p className="text-xs text-muted-foreground">{deployment.duration} • {deployment.time}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Logs</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CICD;
