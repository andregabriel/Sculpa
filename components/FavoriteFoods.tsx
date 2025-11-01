import React, { useState } from 'react';
import type { FavoriteFood } from '../types';
import HeartIcon from './icons/HeartIcon';
import LoaderIcon from './icons/LoaderIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface FavoriteFoodsProps {
  foods: FavoriteFood[];
  onAddFood: (foodDescription: string) => Promise<void>;
  onDeleteFood: (id: string) => void;
}

const FavoriteFoods: React.FC<FavoriteFoodsProps> = ({ foods, onAddFood, onDeleteFood }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Por favor, insira um alimento.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await onAddFood(input);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao adicionar alimento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="favorite-foods" className="animate-fade-in">
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center gap-3 mb-6">
          <HeartIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-center text-indigo-600">Meus Alimentos Favoritos</h2>
        </div>
        
        {/* Add Food Form */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-base mb-2 text-slate-700">Adicionar e Analisar Alimento</h3>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start gap-2">
                <div className="w-full">
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ex: 100g de abacate, 1 fatia de pão integral..."
                        className="w-full bg-white border-2 border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <LoaderIcon /> : <PlusIcon />}
                    Adicionar
                </button>
            </form>
        </div>

        {/* Food List */}
        <div className="space-y-3">
          {foods.length > 0 ? (
            foods.map(food => (
              <div key={food.id} className="bg-slate-50 p-3 rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="font-semibold text-slate-700 flex-1">{food.name}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span><strong>Cal:</strong> {food.calories.toFixed(0)}</span>
                    <span><strong>P:</strong> {food.protein.toFixed(1)}g</span>
                    <span><strong>C:</strong> {food.carbs.toFixed(1)}g</span>
                    <span><strong>G:</strong> {food.fat.toFixed(1)}g</span>
                </div>
                <button 
                    onClick={() => onDeleteFood(food.id)}
                    className="ml-auto md:ml-4 text-slate-400 hover:text-red-500 transition-colors self-start md:self-center"
                    aria-label={`Excluir ${food.name}`}
                >
                    <TrashIcon />
                </button>
              </div>
            ))
          ) : (
             <p className="text-center text-slate-500 p-6">Nenhum alimento favorito salvo ainda.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default FavoriteFoods;