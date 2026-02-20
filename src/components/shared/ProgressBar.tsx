import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

export default function ProgressBar({
  progress,
  label,
  showPercentage = true,
  variant = 'default',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const barColors = {
    default: 'bg-gradient-to-r from-brand-500 to-brand-400',
    success: 'bg-gradient-to-r from-emerald-500 to-green-400',
    error: 'bg-gradient-to-r from-red-500 to-rose-400',
  };

  const trackHeight = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${trackHeight} bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden`}>
        <motion.div
          className={`${trackHeight} rounded-full ${barColors[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
