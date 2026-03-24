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
  const [labelsState, setLabelsState] = React.useState<string[]>(initialLabels);
  const [cpuData, setCpuData] = React.useState<number[]>([65, 59, 80, 81, 56, 55]);
  const [memoryData, setMemoryData] = React.useState<number[]>([28, 48, 40, 19, 86, 27]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const loadMetricsHistory = React.useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [cpuResp, memoryResp] = await Promise.all([
        fetch('/api/metrics/history?metric=cpu&timeframe=1h'),
        fetch('/api/metrics/history?metric=memory&timeframe=1h'),
      ]);

      if (!cpuResp.ok || !memoryResp.ok) {
        throw new Error('Failed to load metrics history');
      }

      const cpuBody = await cpuResp.json();
      const memoryBody = await memoryResp.json();
      const cpuSeries = Array.isArray(cpuBody.metrics) ? cpuBody.metrics : [];
      const memorySeries = Array.isArray(memoryBody.metrics) ? memoryBody.metrics : [];

      const cpuSeriesAsc = [...cpuSeries].reverse();
      const memorySeriesAsc = [...memorySeries].reverse();

      const mergedLabels = cpuSeriesAsc.length > 0
        ? cpuSeriesAsc.map(point => formatTimestamp(point.created_at))
        : memorySeriesAsc.map(point => formatTimestamp(point.created_at));

      setLabelsState(mergedLabels.length > 0 ? mergedLabels : initialLabels);
      setCpuData(cpuSeriesAsc.map(point => Number(point.value)));
      setMemoryData(memorySeriesAsc.map(point => Number(point.value)));
    } catch (e) {
      setError((e as Error).message || 'Unable to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMetricsHistory();
    const intervalId = window.setInterval(loadMetricsHistory, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadMetricsHistory]);

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
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      <Line options={options} data={chartData} />
    </div>
  );
}
