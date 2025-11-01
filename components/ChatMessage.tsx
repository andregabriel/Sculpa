
import React from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';

const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-indigo-600">
            <BotIcon />
        </div>
      )}
      <div
        className={`max-w-xl p-4 rounded-lg ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-slate-100 text-slate-800 rounded-bl-none'
        }`}
      >
        {message.imageUrl && (
            <img src={message.imageUrl} alt="Anexo do usuário" className="rounded-lg max-w-xs mb-2" />
        )}
        <div className="prose prose-sm max-w-none prose-p:my-0 text-inherit">
            {message.content}
            {message.role === 'model' && message.content === '' && (
                <span className="animate-pulse">▍</span>
            )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;