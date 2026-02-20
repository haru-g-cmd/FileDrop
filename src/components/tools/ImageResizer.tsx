import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Lock, Unlock, Sparkles } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import DropZone from '../shared/DropZone';
import { resizeImage, getImageDimensions } from '../../utils/imageUtils';
import { formatFileSize, downloadBlob, getOutputFilename, generateId } from '../../utils/fileUtils';
import { SOCIAL_MEDIA_PRESETS } from '../../constants';
import toast from 'react-hot-toast';
import type { ProcessedFile, ImageDimensions } from '../../types';

export default function ImageResizer() {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    const processedFile: ProcessedFile = {
      id: generateId(),
      originalFile: f,
      originalUrl: URL.createObjectURL(f),
      originalSize: f.size,
      status: 'pending',
      progress: 0,
    };

    try {
      const dims = await getImageDimensions(f);
      setOriginalDimensions(dims);
      setWidth(dims.width);
      setHeight(dims.height);
      setAspectRatio(dims.width / dims.height);
    } catch {
      toast.error('Failed to read image dimensions');
    }

    setFile(processedFile);
  }, []);

  const handleWidthChange = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio && aspectRatio) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  }, [maintainAspectRatio, aspectRatio]);

  const handleHeightChange = useCallback((newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio && aspectRatio) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  }, [maintainAspectRatio, aspectRatio]);

  const applyPreset = useCallback((presetWidth: number, presetHeight: number) => {
    setWidth(presetWidth);
    setHeight(presetHeight);
    setMaintainAspectRatio(false);
  }, []);

  const processFile = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const blob = await resizeImage(file.originalFile, {
        width,
        height,
        maintainAspectRatio,
      });
      const processedUrl = URL.createObjectURL(blob);

      setFile({
        ...file,
        status: 'done',
        progress: 100,
        processedBlob: blob,
        processedUrl,
        processedSize: blob.size,
      });

      toast.success('Image resized!');
    } catch {
      toast.error('Failed to resize image');
    }

    setIsProcessing(false);
  }, [file, width, height, maintainAspectRatio]);

  const handleDownload = useCallback(() => {
    if (file?.processedBlob) {
      downloadBlob(file.processedBlob, getOutputFilename(file.originalFile.name, `-${width}x${height}`));
    }
  }, [file, width, height]);

  const clearFile = useCallback(() => {
    if (file) {
      URL.revokeObjectURL(file.originalUrl);
      if (file.processedUrl) URL.revokeObjectURL(file.processedUrl);
    }
    setFile(null);
    setOriginalDimensions(null);
    setWidth(0);
    setHeight(0);
  }, [file]);

  useEffect(() => {
    return () => {
      if (file) {
        URL.revokeObjectURL(file.originalUrl);
        if (file.processedUrl) URL.revokeObjectURL(file.processedUrl);
      }
    };
  }, []);

  return (
    <ToolLayout
      title="Image Resizer"
      description="Resize images to exact dimensions with smart presets for every social media platform."
      gradient="from-violet-500 to-purple-600"
    >
      {!file ? (
        <DropZone
          accept="image/jpeg,image/png,image/webp"
          onFilesSelected={handleFileSelected}
          label="Drop an image to resize"
          sublabel="Supports JPEG, PNG, WebP • Up to 50MB"
        />
      ) : (
        <div className="space-y-6">
          {/* Image preview */}
          <div className="card overflow-hidden">
            <div className="aspect-video bg-gray-50 dark:bg-black/20 flex items-center justify-center p-4">
              <img
                src={file.processedUrl || file.originalUrl}
                alt={file.originalFile.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{file.originalFile.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Original: {originalDimensions?.width} × {originalDimensions?.height} • {formatFileSize(file.originalSize)}
                  {file.processedSize && ` → ${formatFileSize(file.processedSize)}`}
                </p>
              </div>
              <button onClick={clearFile} className="btn-ghost text-red-500 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resize controls */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Custom Dimensions
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={width}
                  onChange={e => handleWidthChange(Number(e.target.value))}
                  className="input-field font-mono"
                  min={1}
                  max={10000}
                />
              </div>

              <button
                onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                className={`mt-5 p-3 rounded-xl transition-all ${
                  maintainAspectRatio
                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                }`}
                title={maintainAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
              >
                {maintainAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>

              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => handleHeightChange(Number(e.target.value))}
                  className="input-field font-mono"
                  min={1}
                  max={10000}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={processFile} disabled={isProcessing || width <= 0 || height <= 0} className="btn-primary">
                <Sparkles className="w-4 h-4" />
                {isProcessing ? 'Resizing...' : 'Resize Image'}
              </button>
              {file.processedBlob && (
                <button onClick={handleDownload} className="btn-secondary">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
          </div>

          {/* Social media presets */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Social Media Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SOCIAL_MEDIA_PRESETS.map(preset => (
                <motion.button
                  key={preset.name}
                  onClick={() => applyPreset(preset.width, preset.height)}
                  className={`p-3 rounded-xl text-left transition-all border
                    ${width === preset.width && height === preset.height
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{preset.icon}</span>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                    {preset.name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {preset.width}×{preset.height}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
