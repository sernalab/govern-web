import { useRef, useEffect, useState } from 'preact/hooks';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartWrapper from './ChartWrapper';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const DEFAULT_COLORS = [
  '#18181b', // zinc-950
  '#3f3f46', // zinc-700
  '#71717a', // zinc-500
  '#a1a1aa', // zinc-400
  '#d4d4d8', // zinc-300
  '#e4e4e7', // zinc-200
];

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
}

export default function DoughnutChart({ labels, data, colors = DEFAULT_COLORS }: DoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, data.length),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#71717a',
              font: { size: 11 },
              padding: 10,
              usePointStyle: true,
              pointStyleWidth: 8,
              boxHeight: 8,
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
      },
    });

    setLoading(false);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, data, colors]);

  return (
    <ChartWrapper height="300px" loading={loading && !canvasRef.current}>
      <div style={{ position: 'relative', height: '268px' }}>
        <canvas ref={canvasRef} />
      </div>
    </ChartWrapper>
  );
}
