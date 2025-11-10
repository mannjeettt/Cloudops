import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { SystemMetricsChart } from "@/components/SystemMetricsChart";
import { PipelineStatus } from "@/components/PipelineStatus";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { ContainerStats } from "@/components/ContainerStats";
import { Activity, Server, Zap, Database } from "lucide-react";

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
            <p className="text-muted-foreground">Real-time monitoring and system health metrics</p>
          </div>
          
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Active Services"
              value="24"
              change="2.5%"
              icon={Server}
              trend="up"
              status="success"
            />
            <MetricCard
              title="CPU Usage"
              value="68%"
              change="12%"
              icon={Activity}
              trend="up"
              status="warning"
            />
            <MetricCard
              title="Response Time"
              value="145ms"
              change="8%"
              icon={Zap}
              trend="down"
              status="success"
            />
            <MetricCard
              title="Database Queries"
              value="2.4k"
              change="15%"
              icon={Database}
              trend="up"
              status="success"
            />
          </div>
          
          {/* Charts and Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SystemMetricsChart />
            <PipelineStatus />
          </div>
          
          {/* Alerts and Containers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActiveAlerts />
            <ContainerStats />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
