import { useState, useCallback, useEffect } from 'react';
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
              <div className="aspect-square flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <img
                  src={imageUrl}
                  alt="Source"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Color palette */}
              <div className="p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
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
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Colors: {colorCount}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={3}
                      max={16}
                      value={colorCount}
                      onChange={e => setColorCount(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                 [&::-webkit-slider-thumb]:rounded-full
                                 [&::-webkit-slider-thumb]:cursor-pointer"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
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
                  {colors.map((color, index) => (
                    <div
                      key={`${color.hex}-${index}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 group cursor-pointer"
                      onClick={() => handleCopy(color.hex, index)}
                    >
                      <div
                        className="w-10 h-10 rounded-lg shadow-sm flex-shrink-0"
                        style={{ backgroundColor: color.hex, border: '1px solid rgba(0,0,0,0.1)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {color.hex.toUpperCase()}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {color.name} • {color.percentage}%
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gradient preview */}
          {cssGradient && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Generated Gradient
              </h3>
              <div
                className="h-16 rounded-lg"
                style={{ background: cssGradient, borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)' }}
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
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
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
                  <tr className="text-left text-xs" style={{ color: 'var(--color-text-tertiary)', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <th className="pb-2 font-medium">Color</th>
                    <th className="pb-2 font-medium">HEX</th>
                    <th className="pb-2 font-medium">RGB</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((color, i) => (
                    <tr key={i} style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                      <td className="py-2.5">
                        <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => handleCopy(color.hex, i + 100)}
                          className="font-mono text-xs transition-colors"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {color.hex.toUpperCase()}
                        </button>
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => handleCopy(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, i + 200)}
                          className="font-mono text-xs transition-colors"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                        </button>
                      </td>
                      <td className="py-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{color.name}</td>
                      <td className="py-2.5 text-right text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{color.percentage}%</td>
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
