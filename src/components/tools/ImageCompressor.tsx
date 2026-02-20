import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, RotateCcw, Sparkles, Info } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import DropZone from '../shared/DropZone';
import BeforeAfterSlider from '../shared/BeforeAfterSlider';
import ProgressBar from '../shared/ProgressBar';
import { compressImage } from '../../utils/imageUtils';
import { formatFileSize, getCompressionPercentage, downloadBlob, getOutputFilename, generateId } from '../../utils/fileUtils';
import toast from 'react-hot-toast';
import type { ProcessedFile } from '../../types';

export default function ImageCompressor() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
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
    if (!selectedFile && processedFiles.length > 0) {
      setSelectedFile(processedFiles[0]);
    }
  }, [selectedFile]);

  const processFiles = useCallback(async () => {
    setIsProcessing(true);
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const file = updatedFiles[i];
      if (file.status === 'done') continue;

      updatedFiles[i] = { ...file, status: 'processing', progress: 0 };
      setFiles([...updatedFiles]);

      try {
        const format = file.originalFile.type === 'image/png' ? 'image/png' as const :
                       file.originalFile.type === 'image/webp' ? 'image/webp' as const :
                       'image/jpeg' as const;

        const blob = await compressImage(file.originalFile, { quality, format });
        const processedUrl = URL.createObjectURL(blob);

        updatedFiles[i] = {
          ...file,
          status: 'done',
          progress: 100,
          processedBlob: blob,
          processedUrl,
          processedSize: blob.size,
        };
        setFiles([...updatedFiles]);

        // Update selected file if it's the one being processed
        if (selectedFile?.id === file.id) {
          setSelectedFile(updatedFiles[i]);
        }
      } catch {
        updatedFiles[i] = { ...file, status: 'error', progress: 0, error: 'Compression failed' };
        setFiles([...updatedFiles]);
      }
    }

    setIsProcessing(false);
    const successCount = updatedFiles.filter(f => f.status === 'done').length;
    const unchangedCount = updatedFiles.filter(f => f.status === 'done' && f.processedSize === f.originalSize).length;
    if (successCount > 0) {
      toast.success(`${successCount} image${successCount > 1 ? 's' : ''} compressed!`);
    }
    if (unchangedCount > 0) {
      toast(`${unchangedCount} file${unchangedCount > 1 ? 's were' : ' was'} already optimized`, { icon: 'ℹ️' });
    }
  }, [files, quality, selectedFile]);

  const handleDownload = useCallback((file: ProcessedFile) => {
    if (file.processedBlob) {
      downloadBlob(file.processedBlob, getOutputFilename(file.originalFile.name, '-compressed'));
    }
  }, []);

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
          zip.file(getOutputFilename(f.originalFile.name, '-compressed'), f.processedBlob);
        }
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'compressed-images.zip');
      toast.success('ZIP downloaded!');
    }
  }, [files, handleDownload]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.originalUrl);
        if (file.processedUrl) URL.revokeObjectURL(file.processedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  }, [selectedFile]);

  const clearAll = useCallback(() => {
    files.forEach(f => {
      URL.revokeObjectURL(f.originalUrl);
      if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
    });
    setFiles([]);
    setSelectedFile(null);
  }, [files]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => {
        URL.revokeObjectURL(f.originalUrl);
        if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
      });
    };
  }, []);

  const doneFiles = files.filter(f => f.status === 'done');
  const totalOriginal = doneFiles.reduce((sum, f) => sum + f.originalSize, 0);
  const totalCompressed = doneFiles.reduce((sum, f) => sum + (f.processedSize || 0), 0);

  return (
    <ToolLayout
      title="Image Compressor"
      description="Reduce file sizes while preserving visual quality. Compare before and after with an interactive slider."
      gradient="from-emerald-500 to-teal-600"
    >
      {files.length === 0 ? (
        <DropZone
          accept="image/jpeg,image/png,image/webp"
          multiple
          onFilesSelected={handleFilesSelected}
          label="Drop images here to compress"
          sublabel="Supports JPEG, PNG, WebP • Up to 50MB each"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500
                             [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Smallest file</span>
                  <span>Best quality</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={processFiles} disabled={isProcessing} className="btn-primary">
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Compressing...' : 'Compress All'}
                </button>
                <button onClick={clearAll} className="btn-ghost text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add more files button */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/jpeg,image/png,image/webp';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) handleFilesSelected(Array.from(target.files));
                  };
                  input.click();
                }}
                className="btn-ghost text-sm"
              >
                + Add more images
              </button>
            </div>
          </div>

          {/* Stats summary */}
          <AnimatePresence>
            {doneFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card p-5"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Original</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatFileSize(totalOriginal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Compressed</p>
                    <p className="text-lg font-bold text-emerald-500">{formatFileSize(totalCompressed)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Saved</p>
                    <p className="text-lg font-bold text-emerald-500">
                      {getCompressionPercentage(totalOriginal, totalCompressed)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button onClick={handleDownloadAll} className="btn-primary">
                    <Download className="w-4 h-4" />
                    Download {doneFiles.length > 1 ? 'All (ZIP)' : 'Image'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Before/After comparison */}
          <AnimatePresence>
            {selectedFile?.processedUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Drag the slider to compare original vs compressed
                  </span>
                </div>
                <div className="aspect-video bg-gray-50 dark:bg-black/20">
                  <BeforeAfterSlider
                    beforeSrc={selectedFile.originalUrl}
                    afterSrc={selectedFile.processedUrl}
                    beforeLabel={`Original (${formatFileSize(selectedFile.originalSize)})`}
                    afterLabel={`Compressed (${formatFileSize(selectedFile.processedSize || 0)})`}
                    className="w-full h-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File list */}
          <div className="space-y-3">
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedFile(file)}
                className={`card p-4 cursor-pointer transition-all ${
                  selectedFile?.id === file.id
                    ? 'ring-2 ring-emerald-500 shadow-md'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={file.processedUrl || file.originalUrl}
                    alt={file.originalFile.name}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                      {file.originalFile.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{formatFileSize(file.originalSize)}</span>
                      {file.processedSize && (
                        <>
                          <span className="text-xs text-gray-300 dark:text-gray-600">→</span>
                          <span className="text-xs font-semibold text-emerald-500">
                            {formatFileSize(file.processedSize)}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                            -{getCompressionPercentage(file.originalSize, file.processedSize)}%
                          </span>
                        </>
                      )}
                    </div>
                    {file.status === 'processing' && (
                      <ProgressBar progress={50} size="sm" className="mt-2" showPercentage={false} />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'done' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                        className="btn-ghost p-2"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {file.status === 'error' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'pending' as const, progress: 0 } : f));
                        }}
                        className="btn-ghost p-2 text-amber-500"
                        title="Retry"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      className="btn-ghost p-2 text-red-400 hover:text-red-500"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
