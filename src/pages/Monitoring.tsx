import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SystemMetricsChart } from "@/components/SystemMetricsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Network } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Monitoring = () => {
  const [systemMetrics, setSystemMetrics] = React.useState([
    { label: "CPU Usage", value: 0, icon: Cpu, status: "default" },
    { label: "Memory", value: 0, icon: HardDrive, status: "default" },
    { label: "Disk I/O", value: 0, icon: Activity, status: "default" },
    { label: "Network", value: 0, icon: Network, status: "default" },
  ]);

  React.useEffect(() => {
    const loadCurrentMetrics = async () => {
      try {
        const resp = await fetch('/api/metrics/current');
        if (!resp.ok) {
          throw new Error('Unable to fetch system metrics');
        }
        const body = await resp.json();

        if (body.metrics) {
          setSystemMetrics([
            { label: "CPU Usage", value: Math.round(body.metrics.cpu), icon: Cpu, status: body.metrics.cpu > 85 ? 'critical' : body.metrics.cpu > 70 ? 'warning' : 'success' },
            { label: "Memory", value: Math.round(body.metrics.memory.percentage), icon: HardDrive, status: body.metrics.memory.percentage > 85 ? 'critical' : body.metrics.memory.percentage > 70 ? 'warning' : 'success' },
            { label: "Disk I/O", value: Math.round(body.metrics.disk.percentage ?? 0), icon: Activity, status: body.metrics.disk.percentage > 85 ? 'critical' : body.metrics.disk.percentage > 70 ? 'warning' : 'success' },
            { label: "Network", value: Math.round((body.metrics.network.rx + body.metrics.network.tx) || 0), icon: Network, status: 'success' },
          ]);
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      }
    };

    loadCurrentMetrics();
    const intervalId = window.setInterval(loadCurrentMetrics, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">System Monitoring</h2>
            <p className="text-muted-foreground">Real-time infrastructure health and performance metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {systemMetrics.map((metric, index) => (
              <Card key={index} className="bg-card border-border">
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
                  {["API Gateway", "Database Cluster", "Cache Layer", "Message Queue", "Storage Service"].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
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
        </main>
      </div>
    </div>
  );
};

export default Monitoring;
