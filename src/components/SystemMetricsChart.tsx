import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { useMetricHistoryQueries } from "@/hooks/use-cloudops-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const TIMEFRAME_OPTIONS = ["15m", "1h", "6h", "24h"] as const;
const METRIC_CONFIG = {
  cpu: {
    label: "CPU",
    borderColor: "rgb(34, 211, 238)",
    backgroundColor: "rgba(34, 211, 238, 0.16)",
  },
  memory: {
    label: "Memory",
    borderColor: "rgb(248, 113, 113)",
    backgroundColor: "rgba(248, 113, 113, 0.16)",
  },
  disk: {
    label: "Disk",
    borderColor: "rgb(250, 204, 21)",
    backgroundColor: "rgba(250, 204, 21, 0.16)",
  },
} as const;

function formatTimestamp(timestamp: string, timeframe: string): string {
  const date = new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(timeframe === "24h" ? { month: "short", day: "numeric" } : {}),
  });
}

export function SystemMetricsChart() {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAME_OPTIONS)[number]>("1h");
  const [visibleMetrics, setVisibleMetrics] = useState<Array<keyof typeof METRIC_CONFIG>>(["cpu", "memory", "disk"]);
  const metricQueries = useMetricHistoryQueries(timeframe, visibleMetrics);
  const loading = metricQueries.some((query) => query.isLoading);
  const error = metricQueries.find((query) => query.error)?.error;

  const labels = useMemo(() => {
    const firstSeries = metricQueries.find((query) => (query.data || []).length > 0)?.data || [];
    return [...firstSeries].reverse().map((point) => formatTimestamp(point.created_at, timeframe));
  }, [metricQueries, timeframe]);

  const datasets = useMemo(() => visibleMetrics.map((metric, index) => {
    const series = [...(metricQueries[index]?.data || [])].reverse();
    const config = METRIC_CONFIG[metric];

    return {
      label: config.label,
      data: series.map((point) => Number(point.value)),
      borderColor: config.borderColor,
      backgroundColor: config.backgroundColor,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
    };
  }), [metricQueries, visibleMetrics]);

  const hasData = datasets.some((dataset) => dataset.data.length > 0);

  const toggleMetric = (metric: keyof typeof METRIC_CONFIG) => {
    setVisibleMetrics((current) => current.includes(metric)
      ? current.filter((item) => item !== metric)
      : [...current, metric]);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>System Metrics</CardTitle>
          <p className="text-sm text-muted-foreground">Adjust time ranges and filter the signals you want to compare.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TIMEFRAME_OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={timeframe === option ? "default" : "outline"}
              onClick={() => setTimeframe(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(METRIC_CONFIG).map(([metric, config]) => {
            const isActive = visibleMetrics.includes(metric as keyof typeof METRIC_CONFIG);
            return (
              <button
                key={metric}
                type="button"
                onClick={() => toggleMetric(metric as keyof typeof METRIC_CONFIG)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  isActive ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>
        {loading && <p className="text-sm text-muted-foreground">Updating metrics...</p>}
        {error && <p className="text-sm text-destructive">Unable to load metrics history.</p>}
        {!loading && !error && !hasData && (
          <p className="text-sm text-muted-foreground">Metrics history will appear after a few collection cycles.</p>
        )}
        <div className="h-[340px]">
          <Line
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: "index",
                intersect: false,
              },
              plugins: {
                legend: {
                  position: "bottom",
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  ticks: {
                    callback: (value) => `${value}%`,
                  },
                  suggestedMax: 100,
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            }}
            data={{ labels, datasets }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
