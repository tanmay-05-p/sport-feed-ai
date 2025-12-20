'use client';

import { useRef, useEffect } from 'react';
import {
  Header,
  ChatInput,
  ChatMessage,
  LoadingIndicator,
  WelcomeMessage,
} from '@/components';
import { useChat } from '@/lib/hooks';

export default function Home() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <Header onClear={clearMessages} hasMessages={hasMessages} />

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {!hasMessages ? (
            <WelcomeMessage onExampleClick={sendMessage} />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input area */}
      <footer className="border-t border-blue-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800 backdrop-blur-sm px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
          <p className="text-center text-[10px] sm:text-xs text-blue-400/70 dark:text-slate-500 mt-2">
            AI may produce inaccurate information. Verify facts with official sources.
          </p>
        </div>
      </footer>
    </div>
  );
}
