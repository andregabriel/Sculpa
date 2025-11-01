import React, { useState, useEffect } from 'react';
import CloseIcon from './icons/CloseIcon';

interface RestTimerModalProps {
  isOpen: boolean;
  duration: number;
  onClose: () => void;
}

const RestTimerModal: React.FC<RestTimerModalProps> = ({ isOpen, duration, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(duration);
      const timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) {
    return null;
  }

  const size = 200;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / duration);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-4">Descanso</h2>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono font-bold text-white">{timeLeft}</span>
        </div>
      </div>
      <button 
        onClick={onClose} 
        className="mt-8 px-6 py-2 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-black transition-colors"
      >
        Pular Descanso
      </button>
    </div>
  );
};

export default RestTimerModal;
