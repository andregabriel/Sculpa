import React, { useState, useEffect, useRef } from 'react';
import type { Routine, TrainingBlock, Workout, Exercise } from '../types';
import RestTimerModal from './RestTimerModal';
import CheckCircleIcon from './icons/CheckCircleIcon';
import StopwatchIcon from './icons/StopwatchIcon';

const getYoutubeEmbedUrl = (url: string): string | null => {
    let videoId: string | null = null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        }
    } catch (e) {
        console.error("Invalid URL for YouTube parsing", e);
        return null;
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
};

interface WorkoutExecutionProps {
  routine: Routine | null;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

const WorkoutExecution: React.FC<WorkoutExecutionProps> = ({ routine }) => {
  const [selectedBlock, setSelectedBlock] = useState<TrainingBlock | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // State for active workout session
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, number>>({});
  
  // State for rest timer
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(0);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isWorkoutActive) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorkoutActive]);


  const handleStartWorkout = () => {
    if (!selectedWorkout) return;
    setIsWorkoutActive(true);
    setElapsedTime(0);
    const initialProgress: Record<string, number> = {};
    selectedWorkout.exercises.forEach(ex => {
      initialProgress[ex.id] = 0;
    });
    setExerciseProgress(initialProgress);
  };

  const handleFinishWorkout = () => {
    if (!window.confirm("Tem certeza que deseja finalizar o treino?")) return;
    setIsWorkoutActive(false);
  };

  const handleCompleteSet = (exercise: Exercise) => {
    const currentSets = exerciseProgress[exercise.id] || 0;
    const totalSets = exercise.sets;

    if (currentSets < totalSets) {
      setExerciseProgress(prev => ({ ...prev, [exercise.id]: currentSets + 1 }));

      // Trigger rest timer if not the last set
      if (currentSets + 1 < totalSets) {
        setRestDuration(exercise.interval);
        setIsResting(true);
      }
    }
  };

  const handleBackToBlocks = () => {
    if (isWorkoutActive && !window.confirm("Sair irá encerrar o treino atual. Deseja continuar?")) return;
    setIsWorkoutActive(false);
    setSelectedBlock(null);
    setSelectedWorkout(null);
  };

  const handleBackToWorkouts = () => {
    if (isWorkoutActive && !window.confirm("Sair irá encerrar o treino atual. Deseja continuar?")) return;
    setIsWorkoutActive(false);
    setSelectedWorkout(null);
  };

  if (!routine || routine.blocks.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center text-slate-500">
        Nenhum treino planejado. Vá para o "Planejador de Treino" para começar.
      </div>
    );
  }

  // EXERCISE VIEW
  if (selectedBlock && selectedWorkout) {
    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200 animate-fade-in">
        <RestTimerModal 
            isOpen={isResting} 
            duration={restDuration} 
            onClose={() => setIsResting(false)} 
        />
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <button onClick={handleBackToBlocks} className="hover:underline">Blocos</button>
            <span>/</span>
            <button onClick={handleBackToWorkouts} className="hover:underline">{selectedBlock.name}</button>
            <span>/</span>
            <span className="font-semibold text-slate-700">{selectedWorkout.name} (Treino {selectedBlock.workouts.findIndex(w => w.id === selectedWorkout.id) + 1})</span>
        </div>
        
        {isWorkoutActive ? (
            <div className="sticky top-0 bg-white py-2 z-10 flex justify-between items-center mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xl font-bold font-mono text-indigo-600">
                    <StopwatchIcon className="w-6 h-6" />
                    <span>{formatTime(elapsedTime)}</span>
                </div>
                <button onClick={handleFinishWorkout} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md text-sm hover:bg-red-600 transition-colors">
                    Finalizar Treino
                </button>
            </div>
        ) : (
            <div className="text-center my-6">
                <h2 className="text-2xl font-bold text-indigo-600 mb-1">{selectedWorkout.name}</h2>
                {selectedWorkout.observations && <p className="text-slate-600 mb-4 italic">{selectedWorkout.observations}</p>}
                <button onClick={handleStartWorkout} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg text-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
                    Iniciar Treino
                </button>
            </div>
        )}
        
        {selectedWorkout.exercises.length > 0 ? (
             <ul className="space-y-4">
                {selectedWorkout.exercises.map(ex => {
                    const completedSets = exerciseProgress[ex.id] || 0;
                    const isCompleted = completedSets === ex.sets;
                    
                    const embedUrl = ex.videoUrl && (ex.videoUrl.includes('youtube.com') || ex.videoUrl.includes('youtu.be'))
                        ? getYoutubeEmbedUrl(ex.videoUrl)
                        : null;
                    const isBase64Video = ex.videoUrl && ex.videoUrl.startsWith('data:video');

                    return (
                        <li key={ex.id} className={`p-4 rounded-lg border transition-all duration-300 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex justify-between items-start">
                                <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-700' : 'text-slate-800'}`}>{ex.name}</h3>
                                {isCompleted && <div className="flex items-center gap-1 text-sm font-semibold text-green-600"><CheckCircleIcon className="w-5 h-5" />Concluído!</div>}
                            </div>
                            
                            {ex.videoUrl && (
                                <div className="my-3">
                                    <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden shadow-inner">
                                        {isBase64Video && (
                                            <video
                                                src={ex.videoUrl}
                                                controls
                                                className="w-full h-full object-cover"
                                            ></video>
                                        )}
                                        {embedUrl && (
                                            <iframe
                                                src={embedUrl}
                                                title={`Vídeo para ${ex.name}`}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            ></iframe>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 text-center">
                                <div className="bg-white p-2 rounded-md shadow-sm">
                                    <p className="text-xs text-slate-500">Séries</p>
                                    <p className="text-lg font-semibold">{isWorkoutActive ? `${completedSets} / ${ex.sets}` : ex.sets}</p>
                                </div>
                                <div className="bg-white p-2 rounded-md shadow-sm">
                                    <p className="text-xs text-slate-500">Reps</p>
                                    <p className="text-lg font-semibold">{ex.reps}</p>
                                </div>
                                <div className="bg-white p-2 rounded-md shadow-sm">
                                    <p className="text-xs text-slate-500">Intervalo</p>
                                    <p className="text-lg font-semibold">{ex.interval}s</p>
                                </div>
                                <div className="bg-white p-2 rounded-md shadow-sm">
                                    <p className="text-xs text-slate-500">Peso</p>
                                    <p className="text-lg font-semibold">{ex.weight > 0 ? `${ex.weight} kg` : '--'}</p>
                                </div>
                            </div>
                            {ex.instructions && <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-200 whitespace-pre-wrap">{ex.instructions}</p>}
                            
                            {isWorkoutActive && (
                                <div className="mt-4">
                                    <button 
                                        onClick={() => handleCompleteSet(ex)} 
                                        disabled={isCompleted}
                                        className="w-full px-3 py-3 bg-indigo-600 text-white font-bold rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors text-base disabled:bg-slate-300 disabled:cursor-not-allowed">
                                        Concluir Série
                                    </button>
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        ) : <p className="text-center text-slate-500 py-4">Nenhum exercício neste treino.</p>}
      </div>
    );
  }

  // WORKOUT VIEW
  if (selectedBlock) {
    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200 animate-fade-in">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <button onClick={handleBackToBlocks} className="hover:underline">Blocos</button>
            <span>/</span>
            <span className="font-semibold text-slate-700">{selectedBlock.name}</span>
        </div>
        <h2 className="text-2xl font-bold text-indigo-600 mb-4">Selecione um Treino</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {selectedBlock.workouts.map((workout, index) => (
            <button key={workout.id} onClick={() => setSelectedWorkout(workout)} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-indigo-50 hover:border-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <p className="font-bold text-slate-500">Treino {index + 1}</p>
              <p className="text-lg font-bold text-indigo-700">{workout.name}</p>
              <p className="text-sm text-slate-600 mt-1">{workout.exercises.length} exercícios</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // BLOCK VIEW
  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200 animate-fade-in">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">Selecione um Bloco de Treino</h2>
      <div className="space-y-4">
        {routine.blocks.map(block => (
          <button key={block.id} onClick={() => setSelectedBlock(block)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-indigo-50 hover:border-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <h3 className="text-lg font-bold text-indigo-700">{block.name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
              <span><strong>Período:</strong> {block.startDate ? new Date(block.startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/D'} a {block.endDate ? new Date(block.endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/D'}</span>
              <span><strong>Objetivo:</strong> {block.goal || 'Não definido'}</span>
              <span><strong>Nível:</strong> {block.level || 'Não definido'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorkoutExecution;