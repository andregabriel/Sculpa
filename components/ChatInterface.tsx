
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import CloseIcon from './icons/CloseIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

// Isso é necessário para que o typescript reconheça a API com prefixo
// FIX: Add types for the Web Speech API to resolve 'SpeechRecognition' not found errors.
interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface ChatInterfaceProps {
  history: ChatMessageType[];
  onSendMessage: (message: string, image?: { mimeType: string; data: string }) => void;
  isLoading: boolean;
  isReadOnly?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, onSendMessage, isLoading, isReadOnly = false }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Auto-expand on new message or when loading
  useEffect(() => {
    if (isLoading && !isExpanded) {
        setIsExpanded(true);
    }
  }, [isLoading, isExpanded]);

  // Auto-scroll when history changes or when expanded
  useEffect(() => {
    if (isExpanded) {
      // Delay slightly to allow for expansion animation
      setTimeout(scrollToBottom, 300);
    }
  }, [history, isExpanded]);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("A API de Reconhecimento de Fala não é suportada neste navegador.");
      setIsSpeechRecognitionSupported(false);
      return;
    }
    
    setIsSpeechRecognitionSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prevInput => (prevInput ? prevInput.trim() + ' ' : '') + transcript);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      textareaRef.current?.focus();
    };
    
    recognition.onerror = (event) => {
      console.error("Erro no reconhecimento de fala:", event.error);
      if (event.error === 'not-allowed') {
        alert('A permissão para usar o microfone foi negada. Por favor, habilite-a nas configurações do seu navegador.');
      }
      setIsRecording(false);
    }

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch(e) {
        console.error("Não foi possível iniciar o reconhecimento", e);
        setIsRecording(false);
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
        setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setImageFile(null);
        setImagePreview(null);
    }
    e.target.value = '';
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  }
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imageFile) || isLoading || isReadOnly) {
        return;
    }
    if (!isExpanded) {
        setIsExpanded(true);
    }

    let imagePayload: { mimeType: string; data: string } | undefined = undefined;

    if (imageFile) {
        try {
            const base64Data = await fileToBase64(imageFile);
            imagePayload = { mimeType: imageFile.type, data: base64Data };
        } catch (error) {
            console.error("Erro ao converter arquivo para base64", error);
            return;
        }
    }
    
    onSendMessage(input, imagePayload);
    setInput('');
    handleRemoveImage();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-0 sm:px-4" style={{pointerEvents: 'none'}}>
        <div 
            className="mx-auto max-w-3xl bg-white rounded-t-xl shadow-2xl border-x border-t border-slate-200 flex flex-col" 
            style={{pointerEvents: 'auto'}}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 rounded-t-xl flex-shrink-0"
                aria-label={isExpanded ? "Recolher chat" : "Expandir chat"}
                aria-expanded={isExpanded}
            >
                <h2 className="text-lg font-bold text-indigo-600">Converse com a IA</h2>
                <ChevronUpIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`} />
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[60vh]' : 'max-h-0'}`}>
                <div className="overflow-y-auto p-4 pt-0 h-[60vh]">
                    {history.map((msg, index) => (
                        <ChatMessage key={index} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 border-t border-slate-200">
                {isReadOnly ? (
                    <div className="text-center text-sm text-slate-500 p-3 bg-slate-100 rounded-lg">
                        Visualizando histórico. Para conversar com a IA, volte para o dia de hoje.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {imagePreview && (
                        <div className="p-2 bg-slate-100 rounded-t-lg">
                            <div className="relative inline-block">
                            <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-md" />
                            <button 
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-slate-600 hover:text-white hover:bg-red-500 transition-colors shadow"
                                aria-label="Remover imagem"
                            >
                                <CloseIcon />
                            </button>
                            </div>
                        </div>
                        )}
                        <div className={`flex items-end gap-2 ${imagePreview ? 'bg-slate-100 p-2 rounded-b-lg' : ''}`}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                                }
                            }}
                            placeholder="Pergunte sobre sua dieta ou envie uma foto..."
                            rows={1}
                            className="flex-grow bg-slate-100 border-2 border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 resize-none"
                            style={{maxHeight: '150px'}}
                            disabled={isReadOnly}
                        />
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        <button
                            type="button"
                            onClick={handleAttachClick}
                            disabled={isLoading || isReadOnly}
                            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                            aria-label="Anexar imagem"
                            title="Anexar imagem"
                        >
                            <PaperclipIcon className="w-6 h-6" />
                        </button>
                        <button
                            type="button"
                            onClick={handleMicClick}
                            disabled={!isSpeechRecognitionSupported || isLoading || isReadOnly}
                            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isRecording 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                            aria-label={isRecording ? "Parar gravação" : "Gravar mensagem de voz"}
                            title={!isSpeechRecognitionSupported ? "Seu navegador não suporta reconhecimento de voz." : (isRecording ? "Parar gravação" : "Gravar mensagem de voz")}
                        >
                            <MicrophoneIcon className="w-6 h-6" />
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && !imageFile) || isReadOnly}
                            className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
                            aria-label="Enviar mensagem"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    </div>
  );
};

export default ChatInterface;