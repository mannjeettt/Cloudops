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

const data = {
  labels,
  datasets: [
    {
      label: 'CPU Usage',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
    {
      label: 'Memory Usage',
      data: [28, 48, 40, 19, 86, 27],
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
  ],
};

export function SystemMetricsChart() {
  return (
    <div className="w-full h-full p-4">
      <Line options={options} data={data} />
    </div>
  );
}
