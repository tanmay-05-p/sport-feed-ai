interface HeaderProps {
  onClear?: () => void;
  hasMessages?: boolean;
}

export function Header({ onClear, hasMessages }: HeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-slate-800 backdrop-blur-sm border-b border-blue-100 dark:border-slate-700 px-3 sm:px-4 py-3 sm:py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            {/* Trophy icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
            >
              <path
                fillRule="evenodd"
                d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-blue-900 dark:text-white">
              SportsFeed AI
            </h1>
            <p className="text-xs sm:text-sm text-blue-600/70 dark:text-slate-400 hidden xs:block">
              Ask anything about sports
            </p>
          </div>
        </div>

        {hasMessages && onClear && (
          <button
            onClick={onClear}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>
    </header>
  );
}
