import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { SystemMetricsChart } from "@/components/SystemMetricsChart";
import { PipelineStatus } from "@/components/PipelineStatus";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { ContainerStats } from "@/components/ContainerStats";
import { Activity, Server, Zap, Database } from "lucide-react";

const Index = () => {
  const [stats, setStats] = React.useState({
    activeServices: 0,
    cpuUsage: 0,
    activeAlerts: 0,
    dataPoints: 0,
  });

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [metricsResponse, alertsResponse, containersResponse, summaryResponse] = await Promise.all([
          fetch("/api/metrics/current"),
          fetch("/api/alerts/stats"),
          fetch("/api/containers"),
          fetch("/api/metrics/summary"),
        ]);

        const metricsBody = metricsResponse.ok ? await metricsResponse.json() : {};
        const alertsBody = alertsResponse.ok ? await alertsResponse.json() : {};
        const containersBody = containersResponse.ok ? await containersResponse.json() : {};
        const summaryBody = summaryResponse.ok ? await summaryResponse.json() : {};

        const summary = Array.isArray(summaryBody.summary) ? summaryBody.summary : [];
        const totalDataPoints = summary.reduce((sum: number, row: { count?: string | number }) => {
          return sum + Number(row.count || 0);
        }, 0);

        setStats({
          activeServices: Array.isArray(containersBody.containers) ? containersBody.containers.length : 0,
          cpuUsage: Math.round(metricsBody.metrics?.cpu || 0),
          activeAlerts: Number(alertsBody.stats?.total || 0),
          dataPoints: totalDataPoints,
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    };

    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Active Services"
              value={String(stats.activeServices)}
              change="Live"
              icon={Server}
              trend="up"
              status="success"
            />
            <MetricCard
              title="CPU Usage"
              value={`${stats.cpuUsage}%`}
              change="Current"
              icon={Activity}
              trend="up"
              status={stats.cpuUsage > 85 ? "critical" : stats.cpuUsage > 70 ? "warning" : "success"}
            />
            <MetricCard
              title="Active Alerts"
              value={String(stats.activeAlerts)}
              change="Open now"
              icon={Zap}
              trend="up"
              status={stats.activeAlerts > 0 ? "warning" : "success"}
            />
            <MetricCard
              title="Metric Samples"
              value={String(stats.dataPoints)}
              change="Last hour"
              icon={Database}
              trend="up"
              status="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SystemMetricsChart />
            <PipelineStatus />
          </div>

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
