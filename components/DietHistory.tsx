
import React from 'react';
import type { DietLogEntry } from '../types';
import HistoryIcon from './icons/HistoryIcon';
import TrashIcon from './icons/TrashIcon';

interface DietHistoryProps {
  history: DietLogEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onGoToToday: () => void;
}

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
};

const DietHistory: React.FC<DietHistoryProps> = ({ history, selectedId, onSelect, onDelete, onGoToToday }) => {
  const todayId = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 lg:col-span-1 h-full flex flex-col">
      <div className="flex items-center justify-center gap-2 mb-4">
        <HistoryIcon className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-indigo-600">Histórico</h2>
      </div>

      {selectedId !== todayId && (
        <button
          onClick={onGoToToday}
          className="w-full mb-4 px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 transition-colors text-sm"
        >
          Voltar para Hoje
        </button>
      )}

      <ul className="space-y-2 overflow-y-auto flex-grow">
        {history.map(log => (
          <li key={log.id} className="relative group">
            <button
              onClick={() => onSelect(log.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                selectedId === log.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {formatDate(log.date)}
              <span className="block text-xs font-normal opacity-70">
                {log.analysisResult ? `${log.analysisResult.comparison.consumed.calories.toFixed(0)} kcal consumidas` : 'Nenhuma análise'}
              </span>
            </button>
            {log.id !== todayId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Tem certeza que deseja excluir o registro de ${formatDate(log.date)}?`)) {
                    onDelete(log.id);
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Excluir registro"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DietHistory;