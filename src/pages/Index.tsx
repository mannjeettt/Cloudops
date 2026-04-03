import { Activity, Database, Server, Zap } from "lucide-react";

import { ActiveAlerts } from "@/components/ActiveAlerts";
import { ContainerStats } from "@/components/ContainerStats";
import { MetricCard } from "@/components/MetricCard";
import { PipelineStatus } from "@/components/PipelineStatus";
import { SystemMetricsChart } from "@/components/SystemMetricsChart";
import {
  useActiveAlertsQuery,
  useContainersQuery,
  useCurrentMetricsQuery,
  useMetricsSummaryQuery,
  usePipelinesQuery,
} from "@/hooks/use-cloudops-queries";

const Index = () => {
  const { data: containers = [] } = useContainersQuery();
  const { data: alerts = [] } = useActiveAlertsQuery();
  const { data: currentMetrics } = useCurrentMetricsQuery();
  const { data: summary = [] } = useMetricsSummaryQuery();
  const { data: pipelinesData } = usePipelinesQuery();

  const stats = {
    activeServices: containers.length,
    cpuUsage: Math.round(currentMetrics?.metrics?.cpu || 0),
    activeAlerts: alerts.length,
    livePipelines: pipelinesData?.summary.running || 0,
  };

  return (
    <>
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
          title="Live Pipelines"
          value={String(stats.livePipelines)}
          change="Running now"
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
    </>
  );
};

export default Index;
