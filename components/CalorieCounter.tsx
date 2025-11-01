import React, { useState, useRef, useEffect } from 'react';
import { calculateCaloriesFromInput } from '../services/geminiService';
import type { CalorieCalculationResult, CalorieResultHistoryItem } from '../types';
import CalculatorIcon from './icons/CalculatorIcon';
import LoaderIcon from './icons/LoaderIcon';
import SparklesIcon from './icons/SparklesIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';

// Speech Recognition types from ChatInterface
interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string; }; }; };
}
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onstart: () => void; onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void; onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void; stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface CalorieCounterProps {
  history: CalorieResultHistoryItem[];
  onAddResult: (result: CalorieCalculationResult, query: string, imageUrl?: string | null) => void;
  onDeleteResult: (id: string) => void;
}


const CalorieCounter: React.FC<CalorieCounterProps> = ({ history, onAddResult, onDeleteResult }) => {
    const [input, setInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setIsSpeechRecognitionSupported(false);
          return;
        }
        setIsSpeechRecognitionSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event) => setInput(prev => (prev ? prev.trim() + ' ' : '') + event.results[0][0].transcript);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event) => {
            console.error("Erro no reconhecimento de fala:", event.error);
            setIsRecording(false);
        };
        recognitionRef.current = recognition;
        return () => recognitionRef.current?.stop();
    }, []);
    
    const handleMicClick = () => {
        if (!recognitionRef.current) return;
        isRecording ? recognitionRef.current.stop() : recognitionRef.current.start();
    };

    const handleAttachClick = () => fileInputRef.current?.click();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
        if(e.target) e.target.value = '';
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !imageFile)) {
            setError('Por favor, descreva uma refeição, envie uma imagem ou fale no microfone.');
            return;
        }
        setIsLoading(true);
        setError(null);

        let imagePayload: { mimeType: string; data: string } | undefined = undefined;
        if (imageFile) {
            try {
                const base64Data = await fileToBase64(imageFile);
                imagePayload = { mimeType: imageFile.type, data: base64Data };
            } catch (error) {
                console.error("Erro ao converter arquivo para base64", error);
                setError("Falha ao processar a imagem.");
                setIsLoading(false);
                return;
            }
        }

        try {
            const calculationResult = await calculateCaloriesFromInput(input, imagePayload);
            onAddResult(calculationResult, input, imagePreview);
            setInput('');
            handleRemoveImage();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <section id="calorie-counter" className="animate-fade-in">
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-center gap-3 mb-6">
              <CalculatorIcon className="w-7 h-7 text-indigo-600" />
              <h2 className="text-2xl font-bold text-center text-indigo-600">Contador de Calorias Rápido</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="calorie-input" className="block text-sm font-medium text-slate-600 mb-1">Descreva sua refeição, envie uma foto ou use o áudio:</label>
                    <div className="relative">
                        <textarea
                            id="calorie-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ex: 2 ovos fritos e uma xícara de café com leite..."
                            rows={3}
                            className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg p-3 pr-24 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                        />
                        <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center gap-2">
                             <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            <button type="button" onClick={handleAttachClick} className="p-2 rounded-full hover:bg-slate-200 text-slate-500" title="Anexar Imagem"><PaperclipIcon className="w-5 h-5" /></button>
                             <button type="button" onClick={handleMicClick} disabled={!isSpeechRecognitionSupported} className={`p-2 rounded-full hover:bg-slate-200 text-slate-500 ${isRecording ? 'text-red-500' : ''}`} title="Gravar Áudio"><MicrophoneIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>

                {imagePreview && (
                    <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-md" />
                        <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-slate-600 hover:bg-red-500 shadow" aria-label="Remover imagem"><CloseIcon /></button>
                    </div>
                )}
                
                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all">
                    {isLoading ? (<><LoaderIcon /> Calculando...</>) : (<><SparklesIcon /> Calcular Calorias</>)}
                </button>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </form>

            {history.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-4 space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 text-center">Histórico de Cálculos</h3>
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {history.map(item => (
                        <li key={item.id} className="bg-slate-50 p-4 rounded-lg animate-fade-in relative group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-xs text-slate-500">{new Date(item.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                    {item.query && <p className="text-sm italic text-slate-600">"{item.query}"</p>}
                                </div>
                                <button onClick={() => onDeleteResult(item.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" aria-label="Excluir item do histórico">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex gap-4">
                                {item.imageUrl && <img src={item.imageUrl} alt="Análise de imagem" className="w-24 h-24 object-cover rounded-md flex-shrink-0" />}
                                <div className="flex-grow">
                                     <div className="bg-indigo-50 p-3 rounded-lg text-center mb-3">
                                        <p className="text-sm text-slate-600">Total Estimado</p>
                                        <p className="text-2xl font-bold text-indigo-600">{item.result.totalCalories.toFixed(0)} kcal</p>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {item.result.items.map((foodItem, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold text-slate-700">{foodItem.food}</p>
                                                    <p className="font-mono font-semibold text-indigo-700">{foodItem.calories.toFixed(0)} kcal</p>
                                                </div>
                                                {foodItem.notes && <p className="text-xs text-slate-500 mt-0.5 italic">Nota: {foodItem.notes}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                             {item.result.notes && (
                                <div className="mt-3 p-2 bg-slate-100 rounded-md text-xs text-slate-600 italic">
                                    <p><strong>Observações da IA:</strong> {item.result.notes}</p>
                                </div>
                            )}
                        </li>
                    ))}
                    </ul>
                </div>
            )}
        </div>
      </section>
    );
};
export default CalorieCounter;