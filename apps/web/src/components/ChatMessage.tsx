import type { ChatMessage as ChatMessageType } from '@sports-ai/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { SourceList } from './SourceBadge';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div
        className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] ${
          isUser
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl sm:rounded-2xl rounded-br-md shadow-lg shadow-blue-500/20'
            : 'bg-white dark:bg-slate-800 text-blue-900 dark:text-slate-100 rounded-xl sm:rounded-2xl rounded-bl-md shadow-sm border border-blue-100 dark:border-slate-700'
        } px-3 sm:px-4 py-2.5 sm:py-3`}
      >
        {/* Message content */}
        {isUser ? (
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Assistant-only metadata */}
        {!isUser && (
          <div className="mt-2 space-y-2">
            {/* Confidence indicator */}
            {message.confidence && (
              <div className="flex items-center">
                <ConfidenceIndicator confidence={message.confidence} />
              </div>
            )}

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <SourceList sources={message.sources} />
            )}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-200' : 'text-blue-400 dark:text-slate-500'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
