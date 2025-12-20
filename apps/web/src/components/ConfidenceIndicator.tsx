import type { ConfidenceLevel } from '@sports-ai/shared';

interface ConfidenceIndicatorProps {
  confidence: ConfidenceLevel;
}

const confidenceConfig = {
  high: {
    label: 'High confidence',
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  medium: {
    label: 'Medium confidence',
    color: 'bg-sky-400',
    textColor: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
  },
  low: {
    label: 'Low confidence',
    color: 'bg-slate-400',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800/50',
  },
};

export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const config = confidenceConfig[confidence];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      {config.label}
    </div>
  );
}
