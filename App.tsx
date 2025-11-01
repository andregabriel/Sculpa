// FIX: Import `useRef` from React to resolve "Cannot find name 'useRef'" error.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Chat } from '@google/genai';
import { analyzeDiet, generateCalorieRanking, generateRecipe, analyzeFavoriteFood, getNutritionalInfoForItem } from './services/geminiService';
import type { AnalysisResult, ChatMessage, WeightEntry, Routine, RankingCategory, Recipe, FavoriteFood, CalorieCalculationResult, CalorieResultHistoryItem, DietLogEntry, NewRankingItem, CalorieData, Instructor, Client } from './types';
import TextAreaInput from './components/TextAreaInput';
import ResultsDisplay from './components/ResultsDisplay';
import ChatInterface from './components/ChatInterface';
import WeightTracker from './components/WeightTracker';
import WorkoutPlanner from './components/WorkoutPlanner';
import CalorieRanking from './components/CalorieRanking';
import RecipeBook from './components/RecipeBook';
import CalorieCounter from './components/CalorieCounter';
import FavoriteFoods from './components/FavoriteFoods';
import SparklesIcon from './components/icons/SparklesIcon';
import LoaderIcon from './components/icons/LoaderIcon';
import ShortcutMenu from './components/ShortcutMenu';
import SidebarMenu from './components/SidebarMenu';
import MenuIcon from './components/icons/MenuIcon';
import DietHistory from './components/DietHistory';
import CalorieDashboard from './components/CalorieDashboard';
import WorkoutExecution from './components/WorkoutExecution';
import InstructorDashboard from './components/InstructorDashboard';
import EditableDietPlan from './components/EditableDietPlan';


const DIET_PLACEHOLDER = `### Dieta Planejada

Café da manhã
- 2 fatias de pão de forma
- 3 ovos cozidos sem óleo, manteiga ou gordura adicional
- 25g whey protein marca Adaptogen sabor bannoffe

Almoço
- 150g carne de Alcatra
- 200 arroz branco

Lanche 1
- 105g de banana
- 200ml de iogurte desnatado sem adição de açuares
- 45g whey protein marca Adaptogen sabor bannoffe

Lanche 2
- 210g banana
- 15g castanha

Jantar
- 150g de carne de alcatra
- 200g de arroz branco cozido`;

const CONSUMED_PLACEHOLDER = `### Comi hoje

10h 
- 3 ovos
- 2 paes
- 25g whey marca Adaptogen sabor Banoffee
- 120g morango

12h 
- 150g tilapia
- 1 todynho`;

const INITIAL_RANKINGS: RankingCategory[] = [
  {
    id: 'bebidas-1',
    categoryName: "Bebidas Alcoólicas (por dose padrão)",
    items: [
      { id: 'vodka-1', name: "Vodka", calories: 97, unit: "44ml" },
      { id: 'gin-1', name: "Gin", calories: 110, unit: "44ml" },
      { id: 'rum-1', name: "Rum", calories: 110, unit: "44ml" },
      { id: 'whisky-1', name: "Whisky", calories: 110, unit: "44ml" },
      { id: 'cerveja-1', name: "Cerveja (Long Neck)", calories: 145, unit: "355ml" },
      { id: 'vinho-1', name: "Vinho Tinto", calories: 125, unit: "150ml" },
    ]
  },
  {
    id: 'frutas-1',
    categoryName: "Frutas (por 100g)",
    items: [
      { id: 'morango-1', name: "Morango", calories: 32, unit: "100g" },
      { id: 'melao-1', name: "Melão", calories: 34, unit: "100g" },
      { id: 'maca-1', name: "Maçã", calories: 52, unit: "100g" },
      { id: 'laranja-1', name: "Laranja", calories: 47, unit: "100g" },
      { id: 'uva-1', name: "Uva", calories: 69, unit: "100g" },
      { id: 'banana-1', name: "Banana", calories: 89, unit: "100g" },
      { id: 'abacate-1', name: "Abacate", calories: 160, unit: "100g" },
    ]
  },
  {
    id: 'carnes-1',
    categoryName: "Carnes (100g, grelhado)",
    items: [
      { id: 'frango-1', name: "Peito de Frango", calories: 165, unit: "100g" },
      { id: 'file-mignon-1', name: "Filé Mignon", calories: 170, unit: "100g" },
      { id: 'alcatra-1', name: "Alcatra", calories: 200, unit: "100g" },
      { id: 'picanha-1', name: "Picanha (com gordura)", calories: 280, unit: "100g" },
      { id: 'linguica-1', name: "Linguiça Toscana", calories: 320, unit: "100g" },
      { id: 'costela-1', name: "Costela Bovina", calories: 350, unit: "100g" },
    ]
  },
  {
    id: 'queijos-1',
    categoryName: "Queijos (por 100g)",
    items: [
        { id: 'cottage-1', name: "Cottage", calories: 98, unit: "100g" },
        { id: 'ricota-1', name: "Ricota", calories: 174, unit: "100g" },
        { id: 'minas-1', name: "Minas Frescal", calories: 240, unit: "100g" },
        { id: 'mussarela-1', name: "Mussarela", calories: 280, unit: "100g" },
        { id: 'prato-1', name: "Prato", calories: 350, unit: "100g" },
        { id: 'provolone-1', name: "Provolone", calories: 351, unit: "100g" },
        { id: 'parmesao-1', name: "Parmesão", calories: 431, unit: "100g" },
    ]
  }
].map(r => ({ ...r, items: r.items.sort((a, b) => a.calories - b.calories) }));

const sections = [
    { id: 'diet-analyzer', label: 'Análise de Dieta' },
    { id: 'workout-planner', label: 'Planejador de Treino' },
    { id: 'workout-execution', label: 'Executar Treino' },
    { id: 'weight-tracker', label: 'Acompanhamento de Peso' },
    { id: 'calorie-counter', label: 'Contador de Calorias' },
    { id: 'favorite-foods', label: 'Alimentos Favoritos' },
    { id: 'recipe-book', label: 'Livro de Receitas' },
    { id: 'calorie-rankings', label: 'Rankings' },
];

const getTodayId = () => new Date().toISOString().split('T')[0];

const createNewRoutine = (): Routine => ({
    id: `routine-${Date.now()}`,
    name: 'Minha Rotina de Treino',
    blocks: [{
      id: `block-${Date.now()}`,
      name: 'Bloco 1',
      startDate: new Date().toISOString().split('T')[0],
      goal: 'Hipertrofia',
      level: 'Iniciante',
      workouts: [{ id: `workout-${Date.now()}`, name: 'Treino A', observations: '', exercises: [] }],
    }],
});

export default function App(): React.ReactElement {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  // App mode state
  const [viewMode, setViewMode] = useState<'student' | 'instructor'>('student');

  // Student-specific state
  const [dietLogHistory, setDietLogHistory] = useState<DietLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>(getTodayId());
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [rankings, setRankings] = useState<RankingCategory[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [calorieResultsHistory, setCalorieResultsHistory] = useState<CalorieResultHistoryItem[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieData>({ goal: 1998, food: 0, exercise: 0, remaining: 1998 });
  
  // Instructor-specific state
  const [instructorData, setInstructorData] = useState<Instructor>({ clients: [] });

  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentLog = dietLogHistory.find(log => log.id === selectedLogId) || null;
  const chat = useRef<Chat | null>(null);

  // Load initial state from localStorage
  useEffect(() => {
    if (process.env.API_KEY) {
        setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
    }
    try {
      // Student Data
      const storedHistory = localStorage.getItem('dietLogHistory');
      let history: DietLogEntry[] = storedHistory ? JSON.parse(storedHistory) : [];
      
      const todayId = getTodayId();
      const todayLog = history.find(log => log.id === todayId);

      if (!todayLog) {
        const newTodayLog: DietLogEntry = {
          id: todayId,
          date: new Date().toISOString(),
          dietPlan: localStorage.getItem('dietPlan_legacy') || DIET_PLACEHOLDER,
          dailyIntake: localStorage.getItem('dailyIntake_legacy') || CONSUMED_PLACEHOLDER,
          analysisResult: null,
          chatHistory: [{ role: 'model', content: 'Olá! Como posso ajudar você hoje com sua nutrição? Se quiser que eu analise sua dieta, preencha os campos acima ou me envie uma foto de uma refeição.' }],
        };
        history = [newTodayLog, ...history];
      }
      setDietLogHistory(history);
      setSelectedLogId(todayId);

      const storedWeights = localStorage.getItem('weightEntries');
      if (storedWeights) {
        const parsedWeights: WeightEntry[] = JSON.parse(storedWeights);
        parsedWeights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setWeightEntries(parsedWeights);
      }
      
      const storedRoutine = localStorage.getItem('workoutRoutine');
      setRoutine(storedRoutine ? JSON.parse(storedRoutine) : createNewRoutine());

      const storedRankings = localStorage.getItem('calorieRankings');
      setRankings(storedRankings ? JSON.parse(storedRankings) : INITIAL_RANKINGS);
      
      const storedRecipes = localStorage.getItem('recipes');
      if (storedRecipes) setRecipes(JSON.parse(storedRecipes));
      
      const storedFavoriteFoods = localStorage.getItem('favoriteFoods');
      if (storedFavoriteFoods) setFavoriteFoods(JSON.parse(storedFavoriteFoods));
      
      const storedCalorieHistory = localStorage.getItem('calorieResultsHistory');
      if (storedCalorieHistory) setCalorieResultsHistory(JSON.parse(storedCalorieHistory));

      const storedCalorieData = localStorage.getItem('calorieData');
      if (storedCalorieData) setCalorieData(JSON.parse(storedCalorieData));

      // Instructor Data
      const storedInstructorData = localStorage.getItem('instructorData');
      if(storedInstructorData) {
        setInstructorData(JSON.parse(storedInstructorData));
      }

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  // General useEffect for saving most data
  useEffect(() => {
    try {
        // Student data
        if (dietLogHistory.length > 0) localStorage.setItem('dietLogHistory', JSON.stringify(dietLogHistory));
        localStorage.setItem('weightEntries', JSON.stringify(weightEntries));
        localStorage.setItem('calorieRankings', JSON.stringify(rankings));
        localStorage.setItem('recipes', JSON.stringify(recipes));
        localStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods));
        localStorage.setItem('calorieResultsHistory', JSON.stringify(calorieResultsHistory));
        localStorage.setItem('calorieData', JSON.stringify(calorieData));
        if (routine) localStorage.setItem('workoutRoutine', JSON.stringify(routine));

        // Instructor data
        localStorage.setItem('instructorData', JSON.stringify(instructorData));
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }
  }, [dietLogHistory, weightEntries, rankings, recipes, favoriteFoods, calorieResultsHistory, calorieData, routine, instructorData]);

  const updateLogEntry = useCallback((id: string, updates: Partial<DietLogEntry>) => {
    setDietLogHistory(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  }, []);

  const handleDietTextChange = (field: 'dietPlan' | 'dailyIntake', value: string) => {
    if (currentLog) {
      updateLogEntry(currentLog.id, { [field]: value });
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!ai || !currentLog || !currentLog.dietPlan.trim() || !currentLog.dailyIntake.trim()) {
      setError('Por favor, preencha ambos os campos.');
      return;
    }
    setIsLoading(true);
    setError(null);
    updateLogEntry(currentLog.id, { analysisResult: null });
    
    try {
      const result = await analyzeDiet(currentLog.dietPlan, currentLog.dailyIntake);
      const updatedChatHistory: ChatMessage[] = [
        { role: 'model', content: 'Análise concluída! Agora você pode me fazer perguntas específicas sobre os resultados acima.'}
      ];
      updateLogEntry(currentLog.id, { analysisResult: result, chatHistory: updatedChatHistory });

    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao analisar os dados.');
    } finally {
      setIsLoading(false);
    }
  }, [ai, currentLog, updateLogEntry]);

  const handleSendMessage = useCallback(async (message: string, image?: { mimeType: string; data: string }) => {
    if (!currentLog || (!message.trim() && !image) || isChatLoading) return;
    if (!ai) return;

    if (!chat.current) {
        const systemInstruction = currentLog.analysisResult
            ? `Você é um assistente de nutrição. A análise da dieta do usuário é: ${JSON.stringify(currentLog.analysisResult)}. Responda perguntas com base nisso.`
            : `Você é um assistente de nutrição geral.`;
        chat.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
    }

    setIsChatLoading(true);
    const userMessage: ChatMessage = { 
        role: 'user', 
        content: message,
        imageUrl: image ? `data:${image.mimeType};base64,${image.data}` : undefined
    };
    const newHistory = [...currentLog.chatHistory, userMessage];
    updateLogEntry(currentLog.id, { chatHistory: newHistory });

    try {
        const messageParts = [];
        if (message.trim()) messageParts.push({ text: message.trim() });
        if (image) messageParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
        
        const responseStream = await chat.current.sendMessageStream({ message: { parts: messageParts } });
        
        let modelResponse = '';
        updateLogEntry(currentLog.id, { chatHistory: [...newHistory, { role: 'model', content: '' }] });

        for await (const chunk of responseStream) {
            modelResponse += chunk.text;
            setDietLogHistory(prev => prev.map(log => {
                if (log.id === currentLog.id) {
                    const latestHistory = [...log.chatHistory];
                    latestHistory[latestHistory.length - 1] = { role: 'model', content: modelResponse };
                    return { ...log, chatHistory: latestHistory };
                }
                return log;
            }));
        }
    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = { role: 'model', content: 'Desculpe, ocorreu um erro. Tente novamente.' };
        updateLogEntry(currentLog.id, { chatHistory: [...newHistory, errorMessage] });
    } finally {
        setIsChatLoading(false);
    }
  }, [currentLog, isChatLoading, ai, updateLogEntry]);
  
  const handleDeleteLogEntry = useCallback((id: string) => {
    if(id === getTodayId()) {
      alert("Não é possível excluir o registro de hoje.");
      return;
    }
    setDietLogHistory(prev => prev.filter(log => log.id !== id));
    if (selectedLogId === id) {
      setSelectedLogId(getTodayId());
    }
  }, [selectedLogId]);

  const handleAddWeight = useCallback((weight: number) => {
    const newEntry: WeightEntry = { date: new Date().toISOString(), weight };
    setWeightEntries(prev => [...prev, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  }, []);

  const handleDeleteWeight = useCallback((date: string) => {
    setWeightEntries(prev => prev.filter(entry => entry.date !== date));
  }, []);
  
  const handleRoutineChange = useCallback((updatedRoutine: Routine) => {
    setRoutine(updatedRoutine);
  }, []);

  const handleAddNewRanking = useCallback(async (category: string) => {
    const newRanking = await generateCalorieRanking(category);
    setRankings(prev => [...prev, newRanking]);
  }, []);
  
  const handleAddNewRankingItem = useCallback(async (categoryId: string, itemDescription: string) => {
    const nutritionalInfo = await getNutritionalInfoForItem(itemDescription);
    const newItem: NewRankingItem = {
      name: nutritionalInfo.name,
      calories: nutritionalInfo.calories,
      unit: nutritionalInfo.unit,
    };

    setRankings(prevRankings => prevRankings.map(category => {
      if (category.id === categoryId) {
        const updatedItems = [...category.items, { ...newItem, id: `item-${Date.now()}` }];
        updatedItems.sort((a, b) => a.calories - b.calories);
        return { ...category, items: updatedItems };
      }
      return category;
    }));
  }, []);

  const handleAddRecipe = useCallback((recipe: Omit<Recipe, 'id'>) => {
    setRecipes(prev => [{ ...recipe, id: `recipe-${Date.now()}`}, ...prev]);
  }, []);

  const handleDeleteRecipe = useCallback((id: string) => setRecipes(prev => prev.filter(r => r.id !== id)), []);

  const handleGenerateRecipe = useCallback(async (prompt: string) => {
    const recipeData = await generateRecipe(prompt);
    handleAddRecipe({ ...recipeData, source: 'ai' });
  }, [handleAddRecipe]);

  const handleAddFavoriteFood = useCallback(async (foodDescription: string) => {
    const foodData = await analyzeFavoriteFood(foodDescription);
    setFavoriteFoods(prev => [{ ...foodData, id: `food-${Date.now()}`}, ...prev]);
  }, []);

  const handleDeleteFavoriteFood = useCallback((id: string) => setFavoriteFoods(prev => prev.filter(f => f.id !== id)), []);
  
  const handleAddCalorieResult = useCallback((result: CalorieCalculationResult, query: string, imageUrl?: string | null) => {
    const newHistoryItem: CalorieResultHistoryItem = {
      id: `cal-res-${Date.now()}`, date: new Date().toISOString(), query,
      imageUrl: imageUrl || undefined, result,
    };
    setCalorieResultsHistory(prev => [newHistoryItem, ...prev]);
  }, []);

  const handleDeleteCalorieResult = useCallback((id: string) => {
    setCalorieResultsHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleSectionSelect = (id: string) => {
    setActiveSectionId(id);
    setIsSidebarOpen(false);
  };
  
  const handleInstructorDataChange = (updatedInstructorData: Instructor) => {
    setInstructorData(updatedInstructorData);
  }

  const isReadOnly = selectedLogId !== getTodayId();
  
  const studentDietPlan = currentLog?.dietPlan || '';
  // In a real app, this would be fetched based on the logged-in user.
  // Here, we'll use the instructor's plan for the first client as the student's plan if available.
  const studentRoutine = routine;

  if(viewMode === 'instructor') {
      const studentDataForInstructor = instructorData.clients[0];
      if(studentDataForInstructor) {
         if (currentLog) currentLog.dietPlan = studentDataForInstructor.dietPlan;
      }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <header className="w-full p-4 border-b border-slate-200 sticky top-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-between">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label="Abrir menu"
        >
          <MenuIcon />
        </button>
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-600">
            nuhShape
          </h1>
          <p className="text-center text-slate-500 mt-1 text-sm">
            Sua jornada de nutrição e peso, com a ajuda de IA.
          </p>
        </div>
        <button
            onClick={() => setViewMode(prev => prev === 'student' ? 'instructor' : 'student')}
            className="px-3 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
        >
            {viewMode === 'student' ? 'Modo Instrutor' : 'Modo Aluno'}
        </button>
      </header>
      
      {viewMode === 'student' ? (
        <>
            <SidebarMenu 
              sections={sections} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
              activeSectionId={activeSectionId} onSectionSelect={handleSectionSelect}
            />

            <ShortcutMenu 
              sections={sections} activeSectionId={activeSectionId} onSectionSelect={setActiveSectionId}
            />

            <main className="flex-grow p-4 md:p-8 flex flex-col gap-8">
              
              {activeSectionId === 'diet-analyzer' && (
                <div className="animate-fade-in">
                  <section id="diet-analyzer" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <DietHistory 
                      history={dietLogHistory}
                      selectedId={selectedLogId}
                      onSelect={setSelectedLogId}
                      onDelete={handleDeleteLogEntry}
                      onGoToToday={() => setSelectedLogId(getTodayId())}
                    />
                    <div className="lg:col-span-3 space-y-6">
                      <CalorieDashboard data={calorieData} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableDietPlan
                            dietPlan={studentDietPlan}
                            onDietPlanChange={(value) => handleDietTextChange('dietPlan', value)}
                            dailyIntake={currentLog?.dailyIntake || ''}
                            onDailyIntakeChange={(value) => handleDietTextChange('dailyIntake', value)}
                            isReadOnly={isReadOnly}
                        />
                        <TextAreaInput
                            id="daily-intake"
                            label="Itens Consumidos (marque no plano ou adicione aqui)"
                            value={currentLog?.dailyIntake || ''}
                            onChange={(e) => handleDietTextChange('dailyIntake', e.target.value)}
                            placeholder="Itens marcados no plano aparecerão aqui. Adicione extras, se houver..."
                            readOnly={isReadOnly}
                        />
                      </div>
                      {!isReadOnly && (
                        <div className="flex justify-center">
                          <button onClick={handleAnalyze} disabled={isLoading || !ai}
                            className="flex items-center justify-center gap-3 px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                            {isLoading ? <><LoaderIcon /> Analisando...</> : <><SparklesIcon /> Analisar Dieta com Gemini</>}
                          </button>
                        </div>
                      )}
                      <div>
                        {error && (
                          <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg text-center">
                            <p className="font-semibold">Erro!</p>
                            <p>{error}</p>
                          </div>
                        )}
                        {currentLog?.analysisResult && <ResultsDisplay data={currentLog.analysisResult} />}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeSectionId === 'workout-planner' && (
                  <section id="workout-planner" className="animate-fade-in">
                    {studentRoutine && <WorkoutPlanner routine={studentRoutine} onRoutineChange={handleRoutineChange} />}
                  </section>
              )}
              {activeSectionId === 'workout-execution' && (
                  <section id="workout-execution" className="animate-fade-in">
                    <WorkoutExecution routine={studentRoutine} />
                  </section>
              )}
              {activeSectionId === 'weight-tracker' && (
                  <section id="weight-tracker" className="animate-fade-in">
                    <WeightTracker entries={weightEntries} onAddWeight={handleAddWeight} onDeleteWeight={handleDeleteWeight}/>
                  </section>
              )}
              {activeSectionId === 'calorie-counter' && (
                  <section id="calorie-counter" className="animate-fade-in">
                    <CalorieCounter history={calorieResultsHistory} onAddResult={handleAddCalorieResult} onDeleteResult={handleDeleteCalorieResult}/>
                  </section>
              )}
              {activeSectionId === 'favorite-foods' && (
                  <section id="favorite-foods" className="animate-fade-in">
                    <FavoriteFoods foods={favoriteFoods} onAddFood={handleAddFavoriteFood} onDeleteFood={handleDeleteFavoriteFood} />
                  </section>
              )}
              {activeSectionId === 'recipe-book' && (
                  <section id="recipe-book" className="animate-fade-in">
                    <RecipeBook recipes={recipes} onAddRecipe={handleAddRecipe} onDeleteRecipe={handleDeleteRecipe} onGenerateRecipe={handleGenerateRecipe}/>
                  </section>
              )}
              {activeSectionId === 'calorie-rankings' && (
                  <section id="calorie-rankings" className="animate-fade-in">
                    <CalorieRanking rankings={rankings} onGenerateNewRanking={handleAddNewRanking} onAddNewItem={handleAddNewRankingItem} />
                  </section>
              )}
            </main>
            <div className="pb-40" /> 
            {currentLog && (
              <ChatInterface
                history={currentLog.chatHistory}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                isReadOnly={isReadOnly}
              />
            )}
        </>
      ) : (
         <main className="flex-grow p-4 md:p-8">
            <InstructorDashboard
                instructorData={instructorData}
                onDataChange={handleInstructorDataChange}
                createNewRoutine={createNewRoutine}
            />
         </main>
      )}

       <footer className="text-center p-4 text-xs text-slate-500 border-t border-slate-200">
          Powered by Google Gemini API. As informações nutricionais são estimativas e devem ser validadas com um profissional.
      </footer>
    </div>
  );
}