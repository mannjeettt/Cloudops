import { Activity, Cpu, HardDrive, Network } from "lucide-react";

import { SystemMetricsChart } from "@/components/SystemMetricsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrentMetricsQuery } from "@/hooks/use-cloudops-queries";

const Monitoring = () => {
  const { data: metricsResponse } = useCurrentMetricsQuery();
  const metrics = metricsResponse?.metrics;

  const systemMetrics = [
    { label: "CPU Usage", value: Math.round(metrics?.cpu || 0), icon: Cpu },
    { label: "Memory", value: Math.round(metrics?.memory?.percentage || 0), icon: HardDrive },
    { label: "Disk I/O", value: Math.round(metrics?.disk?.percentage || 0), icon: Activity },
    { label: "Network", value: Math.round((metrics?.network?.rx || 0) + (metrics?.network?.tx || 0)), icon: Network },
  ];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">System Monitoring</h2>
        <p className="text-muted-foreground">Real-time infrastructure health and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {systemMetrics.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">{metric.value}%</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
              <Progress value={metric.value} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SystemMetricsChart />

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Service Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["API Gateway", "Database Cluster", "Cache Layer", "Message Queue", "Storage Service"].map((service) => (
                <div key={service} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <span className="font-medium">{service}</span>
                  </div>
                  <span className="text-sm text-success">Operational</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Monitoring;
