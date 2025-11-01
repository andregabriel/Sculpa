import React, { useState, useRef, useEffect } from 'react';
import type { Routine, TrainingBlock, Workout, Exercise, TrainingLevel } from '../types';
import { findYoutubeVideo } from '../services/geminiService';
import DumbbellIcon from './icons/DumbbellIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import VideoIcon from './icons/VideoIcon';
import PlayIcon from './icons/PlayIcon';
import CloseIcon from './icons/CloseIcon';
import PencilIcon from './icons/PencilIcon';
import LoaderIcon from './icons/LoaderIcon';
import SparklesIcon from './icons/SparklesIcon';


interface WorkoutPlannerProps {
  routine: Routine;
  onRoutineChange: (routine: Routine) => void;
}

const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({ routine, onRoutineChange }) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', weight: '', interval: '', instructions: '', youtubeUrl: '' });
  const [formError, setFormError] = useState('');
  
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null); // For base64 data URL from file upload
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  
  const [isFindingVideo, setIsFindingVideo] = useState(false);
  const [findVideoError, setFindVideoError] = useState('');

  const activeBlock = routine.blocks.find(b => b.id === activeBlockId);
  const activeWorkout = activeBlock?.workouts.find(s => s.id === activeWorkoutId);
  const activeWorkoutIndex = activeBlock?.workouts.findIndex(w => w.id === activeWorkoutId) ?? -1;

  useEffect(() => {
    const currentBlockExists = routine.blocks.some(b => b.id === activeBlockId);

    if (routine.blocks.length > 0 && (!activeBlockId || !currentBlockExists)) {
      const firstBlock = routine.blocks[0];
      setActiveBlockId(firstBlock.id);
      setActiveWorkoutId(firstBlock.workouts[0]?.id || null);
    } else if (routine.blocks.length === 0) {
      setActiveBlockId(null);
      setActiveWorkoutId(null);
    }
  }, [routine.blocks, activeBlockId]);

  const handleBlockDetailChange = (blockId: string, field: keyof Omit<TrainingBlock, 'id'|'workouts'>, value: string) => {
    const updatedRoutine = {
        ...routine,
        blocks: routine.blocks.map(b => 
            b.id === blockId ? { ...b, [field]: value } : b
        )
    };
    onRoutineChange(updatedRoutine);
  };

  const handleWorkoutDetailChange = (workoutId: string, field: keyof Omit<Workout, 'id'|'exercises'>, value: string) => {
    if (!activeBlockId) return;
    const updatedRoutine = {
        ...routine,
        blocks: routine.blocks.map(b => {
            if (b.id === activeBlockId) {
                return {
                    ...b,
                    workouts: b.workouts.map(w => 
                        w.id === workoutId ? { ...w, [field]: value } : w
                    )
                };
            }
            return b;
        })
    };
    onRoutineChange(updatedRoutine);
  };

  const handleSaveNewBlock = () => {
    if (newBlockName && newBlockName.trim()) {
      const now = Date.now();
      const newWorkout: Workout = {
        id: `workout-${now}`,
        name: 'Treino A',
        observations: '',
        exercises: [],
      };
      const newBlock: TrainingBlock = {
        id: `block-${now}`,
        name: newBlockName.trim(),
        workouts: [newWorkout],
        startDate: new Date().toISOString().split('T')[0],
        goal: '',
        level: 'Iniciante',
      };
      const updatedRoutine = { ...routine, blocks: [...routine.blocks, newBlock] };
      onRoutineChange(updatedRoutine);
      setActiveBlockId(newBlock.id);
      setActiveWorkoutId(newWorkout.id);
      
      setIsAddingBlock(false);
      setNewBlockName('');
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    const block = routine.blocks.find(b => b.id === blockId);
    if (!window.confirm(`Tem certeza que deseja excluir o bloco "${block?.name}" e todos os seus treinos?`)) return;

    const updatedBlocks = routine.blocks.filter(b => b.id !== blockId);
    const updatedRoutine = { ...routine, blocks: updatedBlocks };
    onRoutineChange(updatedRoutine);

    if (activeBlockId === blockId) {
        setActiveBlockId(updatedBlocks[0]?.id || null);
        setActiveWorkoutId(updatedBlocks[0]?.workouts[0]?.id || null);
    }
  };
  
  const handleSaveNewWorkout = () => {
    if (!activeBlockId || !newWorkoutName.trim()) return;
    
    const newWorkout: Workout = {
        id: `workout-${Date.now()}`,
        name: newWorkoutName.trim(),
        observations: '',
        exercises: []
    };
    const updatedRoutine = {
        ...routine,
        blocks: routine.blocks.map(b => {
            if(b.id === activeBlockId){
                return {...b, workouts: [...b.workouts, newWorkout]};
            }
            return b;
        })
    };
    onRoutineChange(updatedRoutine);
    setActiveWorkoutId(newWorkout.id);

    setIsAddingWorkout(false);
    setNewWorkoutName('');
  };

  const handleDeleteWorkout = (workoutId: string) => {
    if (!activeBlockId) return;
    const currentBlock = activeBlock;
    const workoutToDelete = currentBlock?.workouts.find(w => w.id === workoutId);
    if(!currentBlock || !workoutToDelete || !window.confirm(`Tem certeza que deseja excluir o treino "${workoutToDelete.name}"?`)) return;
    
    const updatedRoutine = {
        ...routine,
        blocks: routine.blocks.map(b => {
            if(b.id === activeBlockId){
                return {...b, workouts: b.workouts.filter(w => w.id !== workoutId)};
            }
            return b;
        })
    };
    
    onRoutineChange(updatedRoutine);
    
    if (activeWorkoutId === workoutId) {
        const updatedBlock = updatedRoutine.blocks.find(b => b.id === activeBlockId);
        setActiveWorkoutId(updatedBlock?.workouts[0]?.id || null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'youtubeUrl' && value) {
        setUploadedVideo(null);
    }
    setNewExercise(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
        setNewExercise(prev => ({...prev, youtubeUrl: ''}));
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedVideo(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedVideo(null);
    }
    if(e.target) e.target.value = '';
  };

  const handleRemoveUploadedVideo = () => {
    setUploadedVideo(null);
  };
  
  const handleFindVideoWithAI = async () => {
    if (!newExercise.name.trim()) {
      setFindVideoError('Digite o nome do exercício primeiro.');
      return;
    }
    setIsFindingVideo(true);
    setFindVideoError('');
    try {
      const url = await findYoutubeVideo(newExercise.name.trim());
      setNewExercise(prev => ({ ...prev, youtubeUrl: url }));
      setUploadedVideo(null);
    } catch (error) {
      setFindVideoError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsFindingVideo(false);
    }
  };


  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBlockId || !activeWorkoutId) return;

    const { name, sets, reps, weight, interval, instructions, youtubeUrl } = newExercise;
    if (!name.trim() || !sets || !reps.trim()) {
      setFormError('Preencha pelo menos o nome, séries e repetições.');
      return;
    }
    if (!uploadedVideo && !youtubeUrl.trim()) {
        setFormError('É obrigatório adicionar um vídeo (upload ou link do YouTube).');
        return;
    }
    const exerciseToAdd: Exercise = {
      id: `ex-${Date.now()}`,
      name: name.trim(),
      sets: parseInt(sets, 10),
      reps: reps.trim(),
      weight: weight ? parseFloat(weight) : 0,
      interval: interval ? parseInt(interval, 10) : 60,
      instructions: instructions.trim(),
      videoUrl: uploadedVideo || youtubeUrl.trim(),
    };
    
    const updatedRoutine = {
        ...routine,
        blocks: routine.blocks.map(b => {
            if (b.id === activeBlockId) {
                return {
                    ...b,
                    workouts: b.workouts.map(w => {
                        if (w.id === activeWorkoutId) {
                            return { ...w, exercises: [...w.exercises, exerciseToAdd] };
                        }
                        return w;
                    })
                };
            }
            return b;
        })
    };

    onRoutineChange(updatedRoutine);
    setNewExercise({ name: '', sets: '', reps: '', weight: '', interval: '', instructions: '', youtubeUrl: '' });
    setUploadedVideo(null);
    setFormError('');
  };
  
  const handleDeleteExercise = (exerciseId: string) => {
    if (!activeBlockId || !activeWorkoutId) return;

    const updatedRoutine = {
        ...routine,
        blocks: routine.blocks.map(b => {
            if (b.id === activeBlockId) {
                return {
                    ...b,
                    workouts: b.workouts.map(w => {
                        if (w.id === activeWorkoutId) {
                            return { ...w, exercises: w.exercises.filter(ex => ex.id !== exerciseId) };
                        }
                        return w;
                    })
                };
            }
            return b;
        })
    };
    onRoutineChange(updatedRoutine);
  };

  return (
    <section id="workout-planner" className="animate-fade-in">
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center gap-3 mb-6">
            <DumbbellIcon className="w-7 h-7 text-indigo-600" />
            <h2 className="text-2xl font-bold text-center text-indigo-600">Planejador de Treino</h2>
        </div>

        {/* Block Management */}
        <div className="mb-4">
            <label className="text-sm font-semibold text-slate-500 mb-2 block">Bloco de Treino:</label>
            <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2 overflow-x-auto">
                {routine.blocks.map(block => (
                    <div key={block.id} className="relative group flex-shrink-0">
                        <button
                            onClick={() => { setActiveBlockId(block.id); setActiveWorkoutId(block.workouts[0]?.id || null); }}
                            className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 text-sm ${
                            activeBlockId === block.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            {block.name}
                        </button>
                         <div className="absolute top-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDeleteBlock(block.id)} className="text-slate-500 hover:text-red-600 p-1.5 bg-white/50 backdrop-blur-sm rounded-full" title="Excluir Bloco"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                {isAddingBlock ? (
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0 animate-fade-in">
                        <input
                            type="text"
                            value={newBlockName}
                            onChange={(e) => setNewBlockName(e.target.value)}
                            placeholder="Nome do Bloco"
                            className="px-2 py-1 border border-slate-300 rounded-md text-sm w-32"
                            autoFocus
                            onKeyDown={(e) => { if(e.key === 'Enter') handleSaveNewBlock(); if(e.key === 'Escape') setIsAddingBlock(false);}}
                        />
                        <button onClick={handleSaveNewBlock} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700">Salvar</button>
                        <button onClick={() => setIsAddingBlock(false)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-300">Cancelar</button>
                    </div>
                ) : (
                    <button onClick={() => { setIsAddingBlock(true); setNewBlockName(`Bloco ${routine.blocks.length + 1}`); }} className="ml-2 flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors" title="Adicionar Novo Bloco">
                        <PlusIcon />
                    </button>
                )}
            </div>
        </div>
        
        {activeBlock ? (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 my-4 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in">
                    <div className="lg:col-span-2">
                        <label htmlFor="block-name" className="block text-sm font-medium text-slate-600 mb-1">Nome do Bloco</label>
                        <input
                            type="text"
                            id="block-name"
                            value={activeBlock.name || ''}
                            onChange={(e) => handleBlockDetailChange(activeBlock.id, 'name', e.target.value)}
                            className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="block-goal" className="block text-sm font-medium text-slate-600 mb-1">Objetivo</label>
                        <input
                            type="text"
                            id="block-goal"
                            value={activeBlock.goal || ''}
                            onChange={(e) => handleBlockDetailChange(activeBlock.id, 'goal', e.target.value)}
                            placeholder="Ex: Hipertrofia"
                            className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="block-level" className="block text-sm font-medium text-slate-600 mb-1">Nível</label>
                        <select
                            id="block-level"
                            value={activeBlock.level || 'Iniciante'}
                            onChange={(e) => handleBlockDetailChange(activeBlock.id, 'level', e.target.value as TrainingLevel)}
                            className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option>Iniciante</option>
                            <option>Intermediário</option>
                            <option>Avançado</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="block-start-date" className="block text-sm font-medium text-slate-600 mb-1">Início</label>
                            <input
                                type="date"
                                id="block-start-date"
                                value={activeBlock.startDate || ''}
                                onChange={(e) => handleBlockDetailChange(activeBlock.id, 'startDate', e.target.value)}
                                className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="block-end-date" className="block text-sm font-medium text-slate-600 mb-1">Fim</label>
                            <input
                                type="date"
                                id="block-end-date"
                                value={activeBlock.endDate || ''}
                                onChange={(e) => handleBlockDetailChange(activeBlock.id, 'endDate', e.target.value)}
                                className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Workout Management */}
                <div className="mb-6">
                    <label className="text-sm font-semibold text-slate-500 mb-2 block">Treinos:</label>
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                    {activeBlock.workouts.map((workout, index) => (
                        <div key={workout.id} className="relative group flex-shrink-0">
                            <button
                                onClick={() => setActiveWorkoutId(workout.id)}
                                className={`px-4 py-2 font-semibold rounded-md transition-colors duration-200 text-sm ${
                                activeWorkoutId === workout.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                Treino {index + 1}
                            </button>
                            <div className="absolute top-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity p-1 gap-1 bg-white/50 backdrop-blur-sm rounded-md">
                                <button onClick={() => handleDeleteWorkout(workout.id)} className="text-slate-400 hover:text-red-600 p-1" title="Excluir Treino"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {isAddingWorkout ? (
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0 animate-fade-in">
                            <input
                                type="text"
                                value={newWorkoutName}
                                onChange={(e) => setNewWorkoutName(e.target.value)}
                                placeholder="Nome do Treino"
                                className="px-2 py-1 border border-slate-300 rounded-md text-sm w-28"
                                autoFocus
                                onKeyDown={(e) => { if(e.key === 'Enter') handleSaveNewWorkout(); if(e.key === 'Escape') setIsAddingWorkout(false);}}
                            />
                            <button onClick={handleSaveNewWorkout} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700">Salvar</button>
                            <button onClick={() => setIsAddingWorkout(false)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-300">Cancelar</button>
                        </div>
                    ) : (
                        <button onClick={() => {
                            const nextWorkoutLetter = String.fromCharCode(65 + (activeBlock.workouts.length || 0));
                            setIsAddingWorkout(true);
                            setNewWorkoutName(`Treino ${nextWorkoutLetter}`);
                        }} className="ml-2 flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors" title="Adicionar Novo Treino">
                            <PlusIcon />
                        </button>
                    )}
                    </div>
                </div>

                {activeWorkout && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mb-6 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in">
                      <div>
                          <label htmlFor="workout-name" className="block text-sm font-medium text-slate-600 mb-1">Nome do Treino</label>
                          <input
                              type="text"
                              id="workout-name"
                              value={activeWorkout.name || ''}
                              onChange={(e) => handleWorkoutDetailChange(activeWorkout.id, 'name', e.target.value)}
                              placeholder="Ex: Peito e Tríceps"
                              className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                      </div>
                      <div>
                          <label htmlFor="workout-observations" className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
                           <input
                              type="text"
                              id="workout-observations"
                              value={activeWorkout.observations || ''}
                              onChange={(e) => handleWorkoutDetailChange(activeWorkout.id, 'observations', e.target.value)}
                              placeholder="Ex: Foco em progressão de carga"
                              className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                      </div>
                  </div>
                )}

                <div className="min-h-[100px]">
                {activeWorkout ? (
                    activeWorkout.exercises.length > 0 ? (
                    <ul className="space-y-3 mb-6">
                        {activeWorkout.exercises.map(ex => (
                            <li key={ex.id} className="flex flex-col items-start gap-2 bg-slate-50 p-3 rounded-md animate-fade-in">
                            <div className="flex justify-between items-start w-full">
                                <span className="font-semibold text-slate-700 pr-2">{ex.name}</span>
                                <button onClick={() => handleDeleteExercise(ex.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"><TrashIcon /></button>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                                <span><strong>{ex.sets}</strong> séries</span>
                                <span><strong>{ex.reps}</strong> reps</span>
                                <span><strong>{ex.interval}s</strong> intervalo</span>
                                {ex.weight > 0 && <span><strong>{ex.weight}</strong> kg</span>}
                                {ex.videoUrl && <button onClick={() => setPlayingVideoUrl(ex.videoUrl!)} className="flex items-center gap-1 text-indigo-600 hover:underline"><PlayIcon className="w-4 h-4" />Ver Vídeo</button>}
                            </div>
                            {ex.instructions && <p className="text-sm text-slate-500 pt-2 border-t border-slate-200 w-full mt-2 whitespace-pre-wrap">{ex.instructions}</p>}
                            </li>
                        ))}
                    </ul>
                    ) : <p className="text-center text-slate-500 py-4">Nenhum exercício adicionado para este treino ainda.</p>
                ) : <p className="text-center text-slate-500 py-4">Nenhum treino selecionado. Crie um para começar.</p>}
                </div>
                
                {activeWorkout && (
                    <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700">Adicionar Novo Exercício ao Treino {activeWorkoutIndex + 1}: "{activeWorkout.name}"</h3>
                        <form onSubmit={handleAddExercise} className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="col-span-2 md:col-span-5">
                                    <label htmlFor="ex-name" className="block text-sm font-medium text-slate-600">Nome do Exercício</label>
                                    <input type="text" id="ex-name" name="name" value={newExercise.name} onChange={handleInputChange} placeholder="Ex: Supino Reto" className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                <div><label htmlFor="ex-sets" className="block text-sm font-medium text-slate-600">Séries</label><input type="number" id="ex-sets" name="sets" value={newExercise.sets} onChange={handleInputChange} placeholder="3" className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/></div>
                                <div><label htmlFor="ex-reps" className="block text-sm font-medium text-slate-600">Reps</label><input type="text" id="ex-reps" name="reps" value={newExercise.reps} onChange={handleInputChange} placeholder="8-12" className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/></div>
                                <div><label htmlFor="ex-interval" className="block text-sm font-medium text-slate-600">Intervalo (s)</label><input type="number" id="ex-interval" name="interval" value={newExercise.interval} onChange={handleInputChange} placeholder="60" className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/></div>
                                <div><label htmlFor="ex-weight" className="block text-sm font-medium text-slate-600">Peso (kg)</label><input type="number" step="0.5" id="ex-weight" name="weight" value={newExercise.weight} onChange={handleInputChange} placeholder="50" className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/></div>
                                
                                <div className="col-span-2 md:col-span-5">
                                    <label className="block text-sm font-medium text-slate-600">Vídeo (Obrigatório)</label>
                                    <div className="flex flex-col sm:flex-row gap-4 mt-1">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    name="youtubeUrl"
                                                    value={newExercise.youtubeUrl}
                                                    onChange={handleInputChange}
                                                    placeholder="Cole um link do YouTube"
                                                    className="w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={handleFindVideoWithAI}
                                                  disabled={isFindingVideo}
                                                  className="p-2 bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors text-sm disabled:bg-slate-300 disabled:cursor-wait shrink-0"
                                                  title="Buscar vídeo com IA"
                                                >
                                                  {isFindingVideo ? <LoaderIcon /> : <SparklesIcon className="w-5 h-5" />}
                                                  <span className="hidden sm:inline">{isFindingVideo ? 'Buscando...' : 'Buscar com IA'}</span>
                                                </button>
                                            </div>
                                            {findVideoError && <p className="text-red-500 text-xs mt-1">{findVideoError}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500">OU</span>
                                            <input type="file" accept="video/*" ref={fileInputRef} onChange={handleVideoChange} className="hidden" />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm"><VideoIcon className="w-5 h-5"/>Upload</button>
                                        </div>
                                    </div>
                                     {uploadedVideo && (<div className="relative mt-2 w-fit"><video src={uploadedVideo} className="h-20 w-36 object-cover rounded-md bg-slate-200" muted /><button type="button" onClick={handleRemoveUploadedVideo} className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 text-slate-500 hover:text-red-500 hover:bg-slate-100 transition-colors shadow"><CloseIcon /></button></div>)}
                                </div>

                                <div className="col-span-2 md:col-span-5"><label htmlFor="ex-instructions" className="block text-sm font-medium text-slate-600">Instruções (opcional)</label><input type="text" id="ex-instructions" name="instructions" value={newExercise.instructions} onChange={handleInputChange} placeholder="Ex: Cadência controlada, foco no peitoral" className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"/></div>
                            </div>
                            <div className="flex justify-end"><button type="submit" className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"><PlusIcon />Adicionar Exercício</button></div>
                        </form>
                        {formError && <p className="text-red-500 text-sm mt-2 text-center">{formError}</p>}
                    </div>
                )}
            </>
        ) : (
             <p className="text-center text-slate-500 py-4">Nenhum bloco de treino encontrado. Crie um para começar!</p>
        )}
      </div>

      {playingVideoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={() => setPlayingVideoUrl(null)}>
            <div className="bg-white rounded-lg p-2 max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    {playingVideoUrl.startsWith('data:video') ? (
                         <video src={playingVideoUrl} controls autoPlay className="w-full rounded" style={{maxHeight: '80vh'}} />
                    ) : (
                         <iframe
                            src={playingVideoUrl}
                            title="Vídeo do Exercício"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full aspect-video rounded"
                          ></iframe>
                    )}
                   
                    <button onClick={() => setPlayingVideoUrl(null)} className="absolute -top-4 -right-4 bg-white rounded-full p-1 text-slate-600 hover:text-slate-900 transition-colors shadow-lg"><CloseIcon /></button>
                </div>
            </div>
        </div>
      )}
    </section>
  );
};

export default WorkoutPlanner;