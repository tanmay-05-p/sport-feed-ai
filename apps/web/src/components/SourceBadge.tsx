interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-slate-300 rounded-md border border-blue-100 dark:border-slate-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-3 h-3 mr-1"
      >
        <path
          fillRule="evenodd"
          d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z"
          clipRule="evenodd"
        />
      </svg>
      {source}
    </span>
  );
}

interface SourceListProps {
  sources: string[];
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-blue-100 dark:border-slate-700">
      <span className="text-xs text-blue-500 dark:text-slate-400 mr-1">Sources:</span>
      {sources.map((source, index) => (
        <SourceBadge key={`${source}-${index}`} source={source} />
      ))}
    </div>
  );
}
