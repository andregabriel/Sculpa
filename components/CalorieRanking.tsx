import React, { useState } from 'react';
import type { RankingCategory } from '../types';
import TrophyIcon from './icons/TrophyIcon';
import LoaderIcon from './icons/LoaderIcon';
import SparklesIcon from './icons/SparklesIcon';
import PlusIcon from './icons/PlusIcon';

interface AddItemFormProps {
  categoryId: string;
  onAddItem: (categoryId: string, itemDescription: string) => Promise<void>;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ categoryId, onAddItem }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await onAddItem(categoryId, input);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao adicionar item.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-200">
      <label className="block text-sm font-medium text-slate-600 mb-1">Adicionar novo item</label>
      <div className="flex items-start gap-2">
        <div className="w-full">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: 100g de kiwi"
                className="w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-shrink-0 px-3 py-2 bg-indigo-600 text-white rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-slate-400 transition-colors text-sm"
        >
          {isLoading ? <LoaderIcon /> : <PlusIcon />}
        </button>
      </div>
    </form>
  );
};


interface AccordionItemProps {
  category: RankingCategory;
  isOpen: boolean;
  onToggle: () => void;
  onAddNewItem: (categoryId: string, itemDescription: string) => Promise<void>;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ category, isOpen, onToggle, onAddNewItem }) => {
  return (
    <div className="border-b border-slate-200">
      <h2>
        <button
          type="button"
          className="flex justify-between items-center w-full p-4 font-semibold text-left text-slate-700 hover:bg-slate-100"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <span>{category.categoryName}</span>
          <svg
            className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
          </svg>
        </button>
      </h2>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="p-4 bg-slate-50">
          <ul className="space-y-2">
            {category.items.map((item) => (
              <li key={item.id} className="flex justify-between items-baseline text-sm">
                <span className="text-slate-600">{item.name} ({item.unit})</span>
                <span className="font-mono font-semibold text-indigo-600">{item.calories.toFixed(0)} kcal</span>
              </li>
            ))}
          </ul>
          <AddItemForm categoryId={category.id} onAddItem={onAddNewItem} />
        </div>
      </div>
    </div>
  );
};

interface CalorieRankingProps {
  rankings: RankingCategory[];
  onGenerateNewRanking: (category: string) => Promise<void>;
  onAddNewItem: (categoryId: string, itemDescription: string) => Promise<void>;
}

const CalorieRanking: React.FC<CalorieRankingProps> = ({ rankings, onGenerateNewRanking, onAddNewItem }) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(rankings[0]?.id || null);
  const [newRankingInput, setNewRankingInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRankingInput.trim()) {
      setError('Por favor, digite uma categoria.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await onGenerateNewRanking(newRankingInput);
      setNewRankingInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar ranking.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="calorie-rankings" className="animate-fade-in">
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center gap-3 mb-6">
          <TrophyIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-center text-indigo-600">Rankings de Calorias</h2>
        </div>
        
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {rankings.map(category => (
            <AccordionItem 
              key={category.id}
              category={category}
              isOpen={openAccordion === category.id}
              onToggle={() => handleToggle(category.id)}
              onAddNewItem={onAddNewItem}
            />
          ))}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-lg mb-2 text-slate-700">Gerar Novo Ranking com IA</h3>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start gap-2">
                <div className="w-full">
                    <input 
                        type="text"
                        value={newRankingInput}
                        onChange={(e) => setNewRankingInput(e.target.value)}
                        placeholder="Ex: pães, chocolates, molhos para salada..."
                        className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <LoaderIcon /> : <SparklesIcon />}
                    Gerar
                </button>
            </form>
        </div>
      </div>
    </section>
  );
};

export default CalorieRanking;