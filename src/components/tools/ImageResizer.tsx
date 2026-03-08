import { useState, useCallback, useEffect } from 'react';
import { Download, Trash2, Lock, Unlock } from 'lucide-react';
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
            <div className="aspect-video flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <img
                src={file.processedUrl || file.originalUrl}
                alt={file.originalFile.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div
              className="p-4 flex items-center justify-between"
              style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--color-border)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{file.originalFile.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
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
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Custom Dimensions
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Width (px)</label>
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
                className="mt-5 p-3 rounded-lg transition-all"
                style={{
                  backgroundColor: maintainAspectRatio ? 'var(--color-accent-muted)' : 'var(--color-bg-tertiary)',
                  color: maintainAspectRatio ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                }}
                title={maintainAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
              >
                {maintainAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>

              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Height (px)</label>
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
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Social Media Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SOCIAL_MEDIA_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.width, preset.height)}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: width === preset.width && height === preset.height
                      ? 'var(--color-accent)'
                      : 'var(--color-border)',
                    backgroundColor: width === preset.width && height === preset.height
                      ? 'var(--color-accent-muted)'
                      : 'transparent',
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    {preset.name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                    {preset.width}×{preset.height}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
