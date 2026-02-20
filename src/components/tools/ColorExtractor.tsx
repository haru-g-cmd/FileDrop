import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RefreshCw, Download, Trash2 } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import DropZone from '../shared/DropZone';
import { extractColors, copyToClipboard } from '../../utils/colorUtils';
import toast from 'react-hot-toast';
import type { ExtractedColor } from '../../types';

export default function ColorExtractor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [colorCount, setColorCount] = useState(8);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const file = files[0];
    setCurrentFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setIsProcessing(true);

    try {
      const extracted = await extractColors(file, colorCount);
      setColors(extracted);
    } catch {
      toast.error('Failed to extract colors');
    }

    setIsProcessing(false);
  }, [colorCount]);

  const reExtract = useCallback(async () => {
    if (!currentFile) return;
    setIsProcessing(true);

    try {
      const extracted = await extractColors(currentFile, colorCount);
      setColors(extracted);
    } catch {
      toast.error('Failed to extract colors');
    }

    setIsProcessing(false);
  }, [currentFile, colorCount]);

  const handleCopy = useCallback(async (text: string, index: number) => {
    await copyToClipboard(text);
    setCopiedIndex(index);
    toast.success(`Copied ${text}`);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const downloadPalette = useCallback(() => {
    // Generate a palette image
    const canvas = document.createElement('canvas');
    const swatchWidth = 200;
    const swatchHeight = 120;
    const padding = 20;
    const textHeight = 40;
    const cols = Math.min(colors.length, 4);
    const rows = Math.ceil(colors.length / cols);

    canvas.width = cols * swatchWidth + padding * 2;
    canvas.height = rows * (swatchHeight + textHeight) + padding * 2;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    colors.forEach((color, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * swatchWidth;
      const y = padding + row * (swatchHeight + textHeight);

      // Draw swatch
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      ctx.roundRect(x + 4, y, swatchWidth - 8, swatchHeight, 8);
      ctx.fill();

      // Draw text
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(color.hex.toUpperCase(), x + 8, y + swatchHeight + 20);
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText(color.name, x + 8, y + swatchHeight + 36);
    });

    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'palette.png';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Palette downloaded!');
      }
    });
  }, [colors]);

  const clearAll = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setColors([]);
    setCurrentFile(null);
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, []);

  // Generate CSS gradient string
  const cssGradient = colors.length > 1
    ? `linear-gradient(90deg, ${colors.map((c, i) => `${c.hex} ${Math.round(i / (colors.length - 1) * 100)}%`).join(', ')})`
    : '';

  return (
    <ToolLayout
      title="Color Extractor"
      description="Extract dominant color palettes from any image. Get hex codes, RGB values, and downloadable palette images."
      gradient="from-pink-500 to-rose-600"
    >
      {!imageUrl ? (
        <DropZone
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onFilesSelected={handleFileSelected}
          label="Drop an image to extract colors"
          sublabel="Supports JPEG, PNG, WebP, SVG"
        />
      ) : (
        <div className="space-y-6">
          {/* Image & palette overview */}
          <div className="card overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Image */}
              <div className="aspect-square bg-gray-50 dark:bg-black/20 flex items-center justify-center p-4">
                <img
                  src={imageUrl}
                  alt="Source"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Color palette */}
              <div className="p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Extracted Colors ({colors.length})
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={clearAll} className="btn-ghost p-2 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Color count slider */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Colors: {colorCount}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={3}
                      max={16}
                      value={colorCount}
                      onChange={e => setColorCount(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500
                                 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <button
                      onClick={reExtract}
                      disabled={isProcessing}
                      className="btn-ghost p-2"
                      title="Re-extract"
                    >
                      <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Color swatches */}
                <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin max-h-80">
                  <AnimatePresence mode="popLayout">
                    {colors.map((color, index) => (
                      <motion.div
                        key={`${color.hex}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 group cursor-pointer"
                        onClick={() => handleCopy(color.hex, index)}
                      >
                        <div
                          className="w-10 h-10 rounded-lg shadow-sm border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">
                            {color.hex.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {color.name} • {color.percentage}%
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Gradient preview */}
          {cssGradient && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Generated Gradient
              </h3>
              <div
                className="h-16 rounded-xl border border-gray-200 dark:border-white/10"
                style={{ background: cssGradient }}
              />
              <button
                onClick={() => { copyToClipboard(cssGradient); toast.success('CSS gradient copied!'); }}
                className="btn-ghost text-sm mt-3"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy CSS
              </button>
            </div>
          )}

          {/* Color details & actions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Color Values
              </h3>
              <button onClick={downloadPalette} className="btn-secondary text-sm">
                <Download className="w-4 h-4" />
                Download Palette
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-white/5">
                    <th className="pb-2 font-medium">Color</th>
                    <th className="pb-2 font-medium">HEX</th>
                    <th className="pb-2 font-medium">RGB</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((color, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                      <td className="py-2.5">
                        <div className="w-6 h-6 rounded-md border border-black/10" style={{ backgroundColor: color.hex }} />
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => handleCopy(color.hex, i + 100)}
                          className="font-mono text-xs hover:text-pink-500 transition-colors"
                        >
                          {color.hex.toUpperCase()}
                        </button>
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => handleCopy(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, i + 200)}
                          className="font-mono text-xs text-gray-500 hover:text-pink-500 transition-colors"
                        >
                          {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                        </button>
                      </td>
                      <td className="py-2.5 text-xs text-gray-500">{color.name}</td>
                      <td className="py-2.5 text-right text-xs font-medium">{color.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
