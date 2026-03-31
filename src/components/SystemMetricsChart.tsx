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

const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

const initialLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

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
      : initialLabels;
  const cpuData = cpuSeriesAsc.length > 0 ? cpuSeriesAsc.map((point) => Number(point.value)) : [65, 59, 80, 81, 56, 55];
  const memoryData = memorySeriesAsc.length > 0 ? memorySeriesAsc.map((point) => Number(point.value)) : [28, 48, 40, 19, 86, 27];
  const loading = cpuHistoryQuery.isLoading || memoryHistoryQuery.isLoading;
  const error = cpuHistoryQuery.error || memoryHistoryQuery.error;

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
      <Line options={options} data={chartData} />
    </div>
  );
}
