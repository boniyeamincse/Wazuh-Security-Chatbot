'use client';

import React from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
  isTyping?: boolean;
}

export function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-100 border border-gray-700'
      }`}>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isTyping && (
            <span className="inline-flex ml-1">
              <span className="animate-pulse">▊</span>
            </span>
          )}
        </div>
        <div className={`text-xs mt-2 ${
          isUser ? 'text-blue-200' : 'text-gray-400'
        }`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}