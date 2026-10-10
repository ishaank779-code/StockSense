import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function PriceChart({
  historical = [],
  predictions = [],
  indicators = null,
  height = 340,
  showVolume = false,
}) {
  const chartData = useMemo(() => {
    const histLabels = historical.map((d) => d.date);
    const histCloses = historical.map((d) => d.close);

    const predLabels = predictions.map((p) => p.date);
    const predValues = predictions.map((p) => p.predicted);
    const lowerBand = predictions.map((p) => p.lower);
    const upperBand = predictions.map((p) => p.upper);

    // Combine labels for continuous axis
    const allLabels = [...histLabels];
    predLabels.forEach((l) => {
      if (!allLabels.includes(l)) allLabels.push(l);
    });

    const datasets = [
      {
        label: 'Close',
        data: histCloses,
        borderColor: '#00d4aa',
        backgroundColor: 'rgba(0, 212, 170, 0.08)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.15,
      },
    ];

    if (indicators?.sma_20) {
      datasets.push({
        label: 'SMA 20',
        data: indicators.sma_20,
        borderColor: '#42a5f5',
        borderWidth: 1.5,
        pointRadius: 0,
        borderDash: [4, 4],
        fill: false,
      });
    }
    if (indicators?.sma_50) {
      datasets.push({
        label: 'SMA 50',
        data: indicators.sma_50,
        borderColor: '#ab47bc',
        borderWidth: 1.5,
        pointRadius: 0,
        borderDash: [6, 3],
        fill: false,
      });
    }

    if (predictions.length > 0) {
      // Pad prediction data to align with full labels
      const pad = histLabels.length - 1;
      const predData = new Array(pad).fill(null).concat([histCloses[histCloses.length - 1], ...predValues]);
      const lowerData = new Array(pad).fill(null).concat([histCloses[histCloses.length - 1], ...lowerBand]);
      const upperData = new Array(pad).fill(null).concat([histCloses[histCloses.length - 1], ...upperBand]);

      datasets.push({
        label: 'Forecast',
        data: predData,
        borderColor: '#ffb74d',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 3,
        pointBackgroundColor: '#ffb74d',
        fill: false,
        tension: 0.2,
      });
      datasets.push({
        label: 'Upper Bound',
        data: upperData,
        borderColor: 'rgba(255, 183, 77, 0.3)',
        borderWidth: 1,
        pointRadius: 0,
        fill: '+1',
        backgroundColor: 'rgba(255, 183, 77, 0.1)',
        tension: 0.2,
      });
      datasets.push({
        label: 'Lower Bound',
        data: lowerData,
        borderColor: 'rgba(255, 183, 77, 0.3)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      });
    }

    return {
      labels: predictions.length
        ? [...histLabels, ...predLabels]
        : histLabels,
      datasets,
    };
  }, [historical, predictions, indicators]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9aa0a6',
          boxWidth: 12,
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: '#1a1f27',
        titleColor: '#e8eaed',
        bodyColor: '#9aa0a6',
        borderColor: '#2a313c',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (v == null) return null;
            return `${ctx.dataset.label}: $${Number(v).toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 10,
          font: { size: 10 },
        },
        grid: { color: 'rgba(42, 49, 60, 0.5)' },
      },
      y: {
        ticks: {
          color: '#6b7280',
          font: { size: 10 },
          callback: (v) => `$${v}`,
        },
        grid: { color: 'rgba(42, 49, 60, 0.5)' },
      },
    },
  };

  if (!historical.length) {
    return (
      <div className="loading-center" style={{ height }}>
        <p>No chart data</p>
      </div>
    );
  }

  return (
    <div className="chart-container" style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
