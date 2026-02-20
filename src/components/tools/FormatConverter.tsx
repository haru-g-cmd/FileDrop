import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import DropZone from '../shared/DropZone';
import { convertImage } from '../../utils/imageUtils';
import { formatFileSize, downloadBlob, getOutputFilename, mimeToExtension, generateId } from '../../utils/fileUtils';
import { FORMAT_OPTIONS } from '../../constants';
import toast from 'react-hot-toast';
import type { ProcessedFile, ConversionOptions } from '../../types';

export default function FormatConverter() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<ConversionOptions['format']>('image/webp');
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const processedFiles: ProcessedFile[] = newFiles.map(file => ({
      id: generateId(),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      originalSize: file.size,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...processedFiles]);
  }, []);

  const processFiles = useCallback(async () => {
    setIsProcessing(true);
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const file = updatedFiles[i];
      if (file.status === 'done') continue;

      updatedFiles[i] = { ...file, status: 'processing', progress: 50 };
      setFiles([...updatedFiles]);

      try {
        const blob = await convertImage(file.originalFile, { format: targetFormat, quality });
        const processedUrl = URL.createObjectURL(blob);

        updatedFiles[i] = {
          ...file,
          status: 'done',
          progress: 100,
          processedBlob: blob,
          processedUrl,
          processedSize: blob.size,
        };
      } catch {
        updatedFiles[i] = { ...file, status: 'error', error: 'Conversion failed' };
      }
      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
    const successCount = updatedFiles.filter(f => f.status === 'done').length;
    if (successCount > 0) {
      toast.success(`${successCount} image${successCount > 1 ? 's' : ''} converted!`);
    }
  }, [files, targetFormat, quality]);

  const handleDownload = useCallback((file: ProcessedFile) => {
    if (file.processedBlob) {
      const ext = mimeToExtension(targetFormat);
      downloadBlob(file.processedBlob, getOutputFilename(file.originalFile.name, '', ext));
    }
  }, [targetFormat]);

  const handleDownloadAll = useCallback(async () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.processedBlob);
    if (doneFiles.length === 1) {
      handleDownload(doneFiles[0]);
      return;
    }
    if (doneFiles.length > 1) {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      doneFiles.forEach(f => {
        if (f.processedBlob) {
          const ext = mimeToExtension(targetFormat);
          zip.file(getOutputFilename(f.originalFile.name, '', ext), f.processedBlob);
        }
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `converted-images${mimeToExtension(targetFormat)}.zip`);
      toast.success('ZIP downloaded!');
    }
  }, [files, handleDownload, targetFormat]);

  const clearAll = useCallback(() => {
    files.forEach(f => {
      URL.revokeObjectURL(f.originalUrl);
      if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
    });
    setFiles([]);
  }, [files]);

  useEffect(() => {
    return () => {
      files.forEach(f => {
        URL.revokeObjectURL(f.originalUrl);
        if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
      });
    };
  }, []);

  const doneFiles = files.filter(f => f.status === 'done');
  const currentFormatLabel = FORMAT_OPTIONS.find(f => f.value === targetFormat)?.label || 'Unknown';

  return (
    <ToolLayout
      title="Format Converter"
      description="Convert images between JPEG, PNG, and WebP formats instantly. Batch processing supported."
      gradient="from-blue-500 to-cyan-600"
    >
      {files.length === 0 ? (
        <DropZone
          accept="image/jpeg,image/png,image/webp"
          multiple
          onFilesSelected={handleFilesSelected}
          label="Drop images to convert"
          sublabel="Supports JPEG, PNG, WebP • Up to 50MB each"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="card p-6">
            <div className="flex flex-col gap-5">
              {/* Target format */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Convert to:
                </label>
                <div className="flex gap-3 flex-wrap">
                  {FORMAT_OPTIONS.map(format => (
                    <button
                      key={format.value}
                      onClick={() => setTargetFormat(format.value as ConversionOptions['format'])}
                      className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                        ${targetFormat === format.value
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15'
                        }`}
                    >
                      <span className="block">{format.label}</span>
                      <span className="block text-xs opacity-70 mt-0.5">{format.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality slider (for JPEG and WebP) */}
              {targetFormat !== 'image/png' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quality: {quality}%
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                               [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={processFiles} disabled={isProcessing} className="btn-primary">
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Converting...' : `Convert to ${currentFormatLabel}`}
                </button>
                <button onClick={clearAll} className="btn-ghost text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Download all */}
          <AnimatePresence>
            {doneFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex justify-center"
              >
                <button onClick={handleDownloadAll} className="btn-primary">
                  <Download className="w-4 h-4" />
                  Download {doneFiles.length > 1 ? 'All (ZIP)' : 'Image'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File list */}
          <div className="space-y-3">
            {files.map((file, index) => {
              const originalExt = file.originalFile.name.split('.').pop()?.toUpperCase() || '?';
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={file.originalUrl}
                      alt={file.originalFile.name}
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                        {file.originalFile.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 font-mono">
                          {originalExt}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          file.status === 'done'
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-white/10'
                        }`}>
                          {currentFormatLabel}
                        </span>
                        {file.processedSize && (
                          <span className="text-xs text-gray-400 ml-2">
                            {formatFileSize(file.originalSize)} → {formatFileSize(file.processedSize)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'done' && (
                        <button onClick={() => handleDownload(file)} className="btn-ghost p-2">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {file.status === 'processing' && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
