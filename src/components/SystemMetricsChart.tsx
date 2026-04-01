import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMetricHistoryQueries } from "@/hooks/use-cloudops-queries";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'System Metrics',
    },
  },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SystemMetricsChart() {
  const [cpuHistoryQuery, memoryHistoryQuery] = useMetricHistoryQueries("1h");
  const cpuSeriesAsc = [...(cpuHistoryQuery.data || [])].reverse();
  const memorySeriesAsc = [...(memoryHistoryQuery.data || [])].reverse();
  const labelsState = cpuSeriesAsc.length > 0
    ? cpuSeriesAsc.map((point) => formatTimestamp(point.created_at))
    : memorySeriesAsc.length > 0
      ? memorySeriesAsc.map((point) => formatTimestamp(point.created_at))
      : [];
  const cpuData = cpuSeriesAsc.map((point) => Number(point.value));
  const memoryData = memorySeriesAsc.map((point) => Number(point.value));
  const loading = cpuHistoryQuery.isLoading || memoryHistoryQuery.isLoading;
  const error = cpuHistoryQuery.error || memoryHistoryQuery.error;
  const hasData = cpuData.length > 0 || memoryData.length > 0;

  const chartData = {
    labels: labelsState,
    datasets: [
      {
        label: 'CPU Usage',
        data: cpuData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Memory Usage',
        data: memoryData,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="w-full h-full p-4">
      {loading && <p className="text-sm text-muted-foreground mb-2">Updating metrics...</p>}
      {error && <p className="text-sm text-destructive mb-2">Unable to load metrics history.</p>}
      {!loading && !error && !hasData && (
        <p className="text-sm text-muted-foreground mb-2">Metrics history will appear after a few collection cycles.</p>
      )}
      <Line options={options} data={chartData} />
    </div>
  );
}
