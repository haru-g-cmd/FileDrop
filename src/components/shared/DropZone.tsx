import { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, X, AlertCircle } from 'lucide-react';
import { formatFileSize } from '../../utils/fileUtils';
import { MAX_FILE_SIZE } from '../../constants';

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function DropZone({
  accept,
  multiple = false,
  maxFiles = 20,
  onFilesSelected,
  label = 'Drop files here or click to browse',
  sublabel,
  icon,
  className = '',
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const acceptedTypes = accept.split(',').map(t => t.trim());
    
    const valid: File[] = [];
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is too large (max ${formatFileSize(MAX_FILE_SIZE)})`);
        continue;
      }
      
      const matchesType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      
      if (!matchesType) {
        setError(`${file.name} is not a supported format`);
        continue;
      }
      
      valid.push(file);
    }

    if (!multiple && valid.length > 1) {
      return [valid[0]];
    }

    return valid.slice(0, maxFiles);
  }, [accept, multiple, maxFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    setIsDragging(true);
    setError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current = 0;
    setIsDragging(false);
    setError(null);

    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [validateFiles, onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const files = validateFiles(e.target.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [validateFiles, onFilesSelected]);

  const acceptExtensions = accept
    .split(',')
    .map(t => {
      const map: Record<string, string> = {
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'image/webp': 'WebP',
        'image/svg+xml': 'SVG',
        'application/pdf': 'PDF',
      };
      return map[t.trim()] || t.trim();
    })
    .join(', ');

  return (
    <div className={className}>
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-white/5'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={isDragging ? { scale: 1.2, y: -10 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`
              p-4 rounded-2xl
              ${isDragging
                ? 'bg-brand-500/10 text-brand-500'
                : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
              }
            `}
          >
            {icon || (isDragging ? <FileImage className="w-10 h-10" /> : <Upload className="w-10 h-10" />)}
          </motion.div>

          <div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {isDragging ? 'Release to upload' : label}
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {sublabel || `Supports ${acceptExtensions} • Max ${formatFileSize(MAX_FILE_SIZE)}`}
            </p>
          </div>
        </div>

        {/* Animated border glow on drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl ring-4 ring-brand-500/20 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-3 flex items-center gap-2 text-sm text-red-500"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={(e) => { e.stopPropagation(); setError(null); }} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
