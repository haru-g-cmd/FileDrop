import { useCallback, useState, useRef } from 'react';
import { Upload, AlertCircle, X } from 'lucide-react';
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

    // If accept is empty or *, accept all
    if (!accept || accept === '*/*') return fileArray.slice(0, maxFiles);

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
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
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
    e.target.value = '';
  }, [validateFiles, onFilesSelected]);

  const acceptExtensions = accept
    .split(',')
    .map(t => {
      const map: Record<string, string> = {
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'image/webp': 'WebP',
        'image/gif': 'GIF',
        'image/svg+xml': 'SVG',
        'image/bmp': 'BMP',
        'application/pdf': 'PDF',
        'image/*': 'Images',
        '*/*': 'Any file',
        'text/plain': 'TXT',
      };
      return map[t.trim()] || t.trim();
    })
    .join(', ');

  return (
    <div className={className}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-8
          transition-colors duration-200
          ${isDragging
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            {icon || <Upload className="w-6 h-6" style={{ color: 'var(--color-text-tertiary)' }} />}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {isDragging ? 'Release to upload' : label}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {sublabel || `Supports ${acceptExtensions} · Max ${formatFileSize(MAX_FILE_SIZE)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={(e) => { e.stopPropagation(); setError(null); }} className="ml-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
