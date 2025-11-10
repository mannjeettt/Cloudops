import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SystemMetricsChart } from "@/components/SystemMetricsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Network } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Monitoring = () => {
  const systemMetrics = [
    { label: "CPU Usage", value: 68, icon: Cpu, status: "warning" },
    { label: "Memory", value: 75, icon: HardDrive, status: "warning" },
    { label: "Disk I/O", value: 42, icon: Activity, status: "success" },
    { label: "Network", value: 56, icon: Network, status: "success" },
  ];

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
