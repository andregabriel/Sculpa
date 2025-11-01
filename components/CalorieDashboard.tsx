import React from 'react';
import type { CalorieData } from '../types';
import FlagIcon from './icons/FlagIcon';
import CutleryIcon from './icons/CutleryIcon';
import FlameIcon from './icons/FlameIcon';

interface CalorieDashboardProps {
  data: CalorieData;
}

const CalorieDashboard: React.FC<CalorieDashboardProps> = ({ data }) => {
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progress = data.goal > 0 ? Math.min(data.food / data.goal, 1) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
        <div className="md:col-span-1 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#4f46e5"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-indigo-600">{Math.round(data.remaining)}</span>
              <span className="text-sm text-slate-500">Restantes</span>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Calorias</h2>
            <p className="text-slate-500 text-sm">Restantes = Meta - Alimentos + Exercícios</p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-around gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                  <FlagIcon className="w-6 h-6 text-slate-500" />
                  <div>
                      <p className="font-semibold">Meta base</p>
                      <p className="text-lg font-bold text-slate-700">{Math.round(data.goal)}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <CutleryIcon className="w-6 h-6 text-blue-500" />
                  <div>
                      <p className="font-semibold">Alimentos</p>
                      <p className="text-lg font-bold text-slate-700">{Math.round(data.food)}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <FlameIcon className="w-6 h-6 text-orange-500" />
                  <div>
                      <p className="font-semibold">Exercícios</p>
                      <p className="text-lg font-bold text-slate-700">{Math.round(data.exercise)}</p>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieDashboard;
