import { useRef, useEffect, useState } from 'preact/hooks';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import ChartWrapper from './ChartWrapper';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface DatasetConfig {
  label: string;
  data: number[];
  color?: string;
}

interface LineChartProps {
  labels: string[];
  datasets: DatasetConfig[];
}

export default function LineChart({ labels, datasets }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
          backgroundColor: (ds.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]) + '1a',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: ds.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#111827',
              font: { size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#111827',
            bodyColor: '#4b5563',
            borderColor: '#e5e7eb',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: '#6b7280', font: { size: 11 } },
            grid: { color: '#e5e7eb33' },
          },
          y: {
            ticks: { color: '#6b7280', font: { size: 11 } },
            grid: { color: '#e5e7eb33' },
          },
        },
      },
    });

    setLoading(false);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, datasets]);

  return (
    <ChartWrapper height="300px" loading={loading && !canvasRef.current}>
      <canvas ref={canvasRef} />
    </ChartWrapper>
  );
}
