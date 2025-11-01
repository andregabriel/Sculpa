import React, { useState } from 'react';
import type { Recipe } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';
import LoaderIcon from './icons/LoaderIcon';
import SparklesIcon from './icons/SparklesIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface RecipeItemProps {
  recipe: Recipe;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
}

const RecipeItem: React.FC<RecipeItemProps> = ({ recipe, isOpen, onToggle, onDelete }) => {
  return (
    <div className="border-b border-slate-200">
      <div className="flex items-center w-full p-4 group">
        <button
          type="button"
          className="flex-grow flex justify-between items-center font-semibold text-left text-slate-700"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            <span>{recipe.name}</span>
            {recipe.source === 'ai' && <SparklesIcon className="w-4 h-4 text-indigo-500" />}
          </div>
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
        <button 
          onClick={() => onDelete(recipe.id)}
          className="ml-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          aria-label={`Excluir receita ${recipe.name}`}
        >
          <TrashIcon />
        </button>
      </div>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="p-4 bg-slate-50 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1">
            <h4>Ingredientes</h4>
            <ul>
                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
            <h4>Modo de Preparo</h4>
            <p className="whitespace-pre-wrap">{recipe.instructions}</p>
        </div>
      </div>
    </div>
  );
};

interface RecipeBookProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  onDeleteRecipe: (id: string) => void;
  onGenerateRecipe: (prompt: string) => Promise<void>;
}

const RecipeBook: React.FC<RecipeBookProps> = ({ recipes, onAddRecipe, onDeleteRecipe, onGenerateRecipe }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  // State for manual form
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [manualError, setManualError] = useState('');
  
  // State for AI form
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleToggle = (id: string) => {
    setOpenRecipeId(openRecipeId === id ? null : id);
  };
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ingredients.trim() || !instructions.trim()) {
      setManualError('Por favor, preencha todos os campos.');
      return;
    }
    onAddRecipe({
        name: name.trim(),
        ingredients: ingredients.trim().split('\n'),
        instructions: instructions.trim(),
        source: 'manual'
    });
    setName('');
    setIngredients('');
    setInstructions('');
    setManualError('');
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      setAiError('Por favor, descreva a receita que você quer.');
      return;
    }
    setIsLoading(true);
    setAiError('');
    try {
      await onGenerateRecipe(aiPrompt);
      setAiPrompt('');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Falha ao gerar a receita.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <section id="recipe-book" className="animate-fade-in">
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BookOpenIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-center text-indigo-600">Meu Livro de Receitas</h2>
        </div>
        
        {/* Add Recipe Section */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="mb-4 border-b border-slate-200">
                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('ai')} className={`shrink-0 border-b-2 px-1 pb-2 text-sm font-medium ${activeTab === 'ai' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                        Gerar com IA
                    </button>
                    <button onClick={() => setActiveTab('manual')} className={`shrink-0 border-b-2 px-1 pb-2 text-sm font-medium ${activeTab === 'manual' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                        Adicionar Manualmente
                    </button>
                </nav>
            </div>

            {activeTab === 'ai' && (
                <div className="animate-fade-in">
                    <h3 className="font-semibold text-base mb-2 text-slate-700">Gerar Nova Receita com IA</h3>
                    <form onSubmit={handleAiSubmit} className="flex flex-col sm:flex-row items-start gap-2">
                        <div className="w-full">
                            <input 
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ex: salmão com legumes, lanche proteico rápido..."
                                className="w-full bg-white border-2 border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                            />
                            {aiError && <p className="text-red-500 text-sm mt-1">{aiError}</p>}
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
            )}
             {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4 animate-fade-in">
                    <h3 className="font-semibold text-base mb-2 text-slate-700">Adicionar Receita Manualmente</h3>
                     <div>
                        <label htmlFor="recipe-name" className="block text-sm font-medium text-slate-600">Nome da Receita</label>
                        <input type="text" id="recipe-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                     <div>
                        <label htmlFor="recipe-ingredients" className="block text-sm font-medium text-slate-600">Ingredientes (um por linha)</label>
                        <textarea id="recipe-ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                     <div>
                        <label htmlFor="recipe-instructions" className="block text-sm font-medium text-slate-600">Modo de Preparo</label>
                        <textarea id="recipe-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    {manualError && <p className="text-red-500 text-sm">{manualError}</p>}
                    <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                            <PlusIcon /> Adicionar Receita
                        </button>
                    </div>
                </form>
             )}
        </div>

        {/* Recipe List */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {recipes.length > 0 ? (
            recipes.map(recipe => (
              <RecipeItem 
                key={recipe.id}
                recipe={recipe}
                isOpen={openRecipeId === recipe.id}
                onToggle={() => handleToggle(recipe.id)}
                onDelete={onDeleteRecipe}
              />
            ))
          ) : (
             <p className="text-center text-slate-500 p-6">Nenhuma receita salva ainda. Adicione uma ou gere com a IA!</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecipeBook;
