
import React from 'react';
import type { WeightEntry } from '../types';

interface WeightChartProps {
  entries: WeightEntry[];
}

const WeightChart: React.FC<WeightChartProps> = ({ entries }) => {
  if (entries.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        <p>{entries.length === 1 ? 'Adicione mais um registro para ver o gráfico.' : 'Nenhum registro de peso ainda.'}</p>
      </div>
    );
  }

  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const weights = entries.map(e => e.weight);
  const dates = entries.map(e => new Date(e.date));

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const minDate = Math.min(...dates.map(d => d.getTime()));
  const maxDate = Math.max(...dates.map(d => d.getTime()));

  // Add some buffer to min/max weight for better visualization
  const weightRange = maxWeight - minWeight;
  const yMin = weightRange === 0 ? minWeight - 1 : minWeight - weightRange * 0.1;
  const yMax = weightRange === 0 ? maxWeight + 1 : maxWeight + weightRange * 0.1;

  const dateRange = maxDate - minDate;

  const getX = (date: Date) => {
    if (dateRange === 0) return padding.left;
    return padding.left + ((date.getTime() - minDate) / dateRange) * (width - padding.left - padding.right);
  };

  const getY = (weight: number) => {
    const yRange = yMax - yMin;
    if (yRange === 0) return height - padding.bottom;
    return height - padding.bottom - ((weight - yMin) / yRange) * (height - padding.top - padding.bottom);
  };

  const pathData = entries
    .map((entry, i) => {
      const x = getX(new Date(entry.date));
      const y = getY(entry.weight);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');
    
  const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" aria-label="Gráfico de evolução de peso">
      {/* Y-axis labels */}
      <text x={padding.left - 8} y={padding.top} textAnchor="end" fill="#94a3b8" fontSize="10">{yMax.toFixed(1)}</text>
      <text x={padding.left - 8} y={height - padding.bottom} textAnchor="end" fill="#94a3b8" fontSize="10">{yMin.toFixed(1)}</text>
      
      {/* X-axis labels */}
      <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" fill="#94a3b8" fontSize="10">{formatDate(new Date(minDate))}</text>
      <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" fill="#94a3b8" fontSize="10">{formatDate(new Date(maxDate))}</text>

      {/* Grid lines */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e2e8f0" strokeWidth="1" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e2e8f0" strokeWidth="1" />

      {/* Line path */}
      <path d={pathData} fill="none" stroke="#4f46e5" strokeWidth="2" />

      {/* Data points */}
      {entries.map((entry, i) => (
        <circle key={i} cx={getX(new Date(entry.date))} cy={getY(entry.weight)} r="4" fill="#4f46e5" stroke="#f8fafc" strokeWidth="2">
           <title>{`${formatDate(new Date(entry.date))}: ${entry.weight.toFixed(1)} kg`}</title>
        </circle>
      ))}
    </svg>
  );
};

export default WeightChart;