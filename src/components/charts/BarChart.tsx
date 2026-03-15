import { useRef, useEffect, useState } from 'preact/hooks';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import ChartWrapper from './ChartWrapper';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface BarChartProps {
  labels: string[];
  data: number[];
  label: string;
  color?: string;
  horizontal?: boolean;
}

export default function BarChart({ labels, data, label, color = '#18181b', horizontal = false }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            backgroundColor: color + 'cc',
            borderColor: color,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
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
  }, [labels, data, label, color, horizontal]);

  return (
    <ChartWrapper height="300px" loading={loading && !canvasRef.current}>
      <div style={{ position: 'relative', height: '268px' }}>
        <canvas ref={canvasRef} />
      </div>
    </ChartWrapper>
  );
}
