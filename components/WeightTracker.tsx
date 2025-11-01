
import React, { useState } from 'react';
import type { WeightEntry } from '../types';
import WeightChart from './WeightChart';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface WeightTrackerProps {
  entries: WeightEntry[];
  onAddWeight: (weight: number) => void;
  onDeleteWeight: (date: string) => void;
}

const WeightTracker: React.FC<WeightTrackerProps> = ({ entries, onAddWeight, onDeleteWeight }) => {
  const [weightInput, setWeightInput] = useState('');
  const [error, setError] = useState('');
  
  const lastWeight = entries.length > 0 ? entries[entries.length - 1].weight : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(weightInput);
    if (!weightValue || weightValue <= 0) {
      setError('Por favor, insira um peso válido.');
      return;
    }
    setError('');
    onAddWeight(weightValue);
    setWeightInput('');
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">Acompanhamento de Peso</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <form onSubmit={handleSubmit} className="md:col-span-1 flex flex-col items-center gap-4">
          <label htmlFor="weight-input" className="text-lg font-semibold text-slate-700">Peso de Hoje (kg)</label>
          <input
            id="weight-input"
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder={lastWeight ? `${lastWeight.toFixed(1)} kg` : "Ex: 75.5"}
            className="bg-slate-100 border-2 border-slate-200 rounded-lg p-3 text-2xl text-center font-mono w-40 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
          />
           {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors duration-300"
          >
            <PlusIcon />
            Registrar
          </button>
        </form>
        
        <div className="md:col-span-2 h-64 md:h-full">
           <WeightChart entries={entries} />
        </div>
      </div>
      
      {entries.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-lg mb-2 text-center md:text-left text-slate-700">Histórico de Registros</h3>
            <ul className="max-h-40 overflow-y-auto pr-2 space-y-2">
                {entries.slice().reverse().map(entry => (
                    <li key={entry.date} className="flex justify-between items-center bg-slate-100 p-2 rounded-md">
                       <div>
                            <span className="font-semibold text-slate-600">{new Date(entry.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="ml-4 font-mono text-indigo-600 font-semibold">{entry.weight.toFixed(1)} kg</span>
                       </div>
                       <button 
                         onClick={() => onDeleteWeight(entry.date)} 
                         className="text-slate-400 hover:text-red-500 transition-colors"
                         aria-label={`Excluir registro de ${entry.date}`}
                       >
                           <TrashIcon />
                       </button>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default WeightTracker;