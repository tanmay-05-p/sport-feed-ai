export function LoadingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl rounded-bl-md shadow-sm border border-blue-100 dark:border-slate-700 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-1">
          <span className="typing-dot w-2 h-2 bg-blue-400 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-blue-400 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-blue-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}
