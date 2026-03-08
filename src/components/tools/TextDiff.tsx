import { useState, useCallback, useRef } from 'react';
import { ArrowRightLeft, Upload, Trash2, Plus, Minus, Equal } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import { computeDiff } from '../../utils/diffUtils';
import toast from 'react-hot-toast';
import type { DiffLine } from '../../types';

interface DiffResult {
  left: DiffLine[];
  right: DiffLine[];
  stats: { added: number; removed: number; unchanged: number };
}

export default function TextDiff() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [result, setResult] = useState<DiffResult | null>(null);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  const handleCompare = useCallback(() => {
    if (!original.trim() && !modified.trim()) {
      toast.error('Enter text in both panes to compare');
      return;
    }
    const diff = computeDiff(original, modified);
    setResult(diff);
    toast.success('Diff computed!');
  }, [original, modified]);

  const handleClear = useCallback(() => {
    setOriginal('');
    setModified('');
    setResult(null);
  }, []);

  const handleFileUpload = useCallback(
    (side: 'left' | 'right') => {
      const inputRef = side === 'left' ? leftFileRef : rightFileRef;
      inputRef.current?.click();
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.name.endsWith('.json') && !file.name.endsWith('.csv') && !file.name.endsWith('.xml') && !file.name.endsWith('.html') && !file.name.endsWith('.css') && !file.name.endsWith('.js') && !file.name.endsWith('.ts') && !file.name.endsWith('.tsx') && !file.name.endsWith('.jsx')) {
        // Try to read it anyway since many text files have generic MIME types
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        if (side === 'left') {
          setOriginal(text);
        } else {
          setModified(text);
        }
        toast.success(`Loaded ${file.name}`);
      };
      reader.onerror = () => {
        toast.error(`Failed to read ${file.name}`);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    []
  );

  const getDiffLineStyle = (type: DiffLine['type']): React.CSSProperties => {
    switch (type) {
      case 'added':
        return { backgroundColor: 'rgba(34, 197, 94, 0.12)' };
      case 'removed':
        return { backgroundColor: 'rgba(239, 68, 68, 0.12)' };
      default:
        return {};
    }
  };

  const getDiffLineColor = (type: DiffLine['type']): string => {
    switch (type) {
      case 'added':
        return '#22c55e';
      case 'removed':
        return '#ef4444';
      default:
        return 'var(--color-text-tertiary)';
    }
  };

  const getDiffSymbol = (type: DiffLine['type']): string => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      default:
        return ' ';
    }
  };

  return (
    <ToolLayout
      title="Text Diff"
      description="Compare two texts side by side and highlight the differences."
    >
      <div className="space-y-5">
        {/* Input panes */}
        {!result && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Original (left) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Original
                </label>
                <button
                  onClick={() => handleFileUpload('left')}
                  className="btn-ghost text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <input
                  ref={leftFileRef}
                  type="file"
                  accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,text/*"
                  onChange={(e) => handleFileChange(e, 'left')}
                  className="hidden"
                />
              </div>
              <textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Paste original text here..."
                className="input-field resize-none font-mono text-sm leading-relaxed"
                rows={16}
              />
            </div>

            {/* Modified (right) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Modified
                </label>
                <button
                  onClick={() => handleFileUpload('right')}
                  className="btn-ghost text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <input
                  ref={rightFileRef}
                  type="file"
                  accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,text/*"
                  onChange={(e) => handleFileChange(e, 'right')}
                  className="hidden"
                />
              </div>
              <textarea
                value={modified}
                onChange={(e) => setModified(e.target.value)}
                placeholder="Paste modified text here..."
                className="input-field resize-none font-mono text-sm leading-relaxed"
                rows={16}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {!result ? (
            <button
              onClick={handleCompare}
              disabled={!original.trim() && !modified.trim()}
              className="btn-primary"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Compare
            </button>
          ) : (
            <button
              onClick={() => setResult(null)}
              className="btn-secondary"
            >
              Edit texts
            </button>
          )}
          <button onClick={handleClear} className="btn-ghost text-red-500">
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Stats bar */}
        {result && (
          <div
            className="card p-4 flex flex-wrap items-center gap-4"
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" style={{ color: '#22c55e' }} />
              <span className="text-sm font-medium" style={{ color: '#22c55e' }}>
                {result.stats.added} added
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="text-sm font-medium" style={{ color: '#ef4444' }}>
                {result.stats.removed} removed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Equal className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {result.stats.unchanged} unchanged
              </span>
            </div>
          </div>
        )}

        {/* Diff results */}
        {result && (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'var(--color-border)' }}>
              {/* Header */}
              <div
                className="px-4 py-2 text-xs font-semibold border-b"
                style={{
                  color: 'var(--color-text-tertiary)',
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                }}
              >
                Original
              </div>
              <div
                className="px-4 py-2 text-xs font-semibold border-b"
                style={{
                  color: 'var(--color-text-tertiary)',
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                }}
              >
                Modified
              </div>

              {/* Left panel */}
              <div className="overflow-x-auto scrollbar-thin max-h-[600px] overflow-y-auto">
                {result.left.map((line, i) => (
                  <div
                    key={`left-${i}`}
                    className="flex"
                    style={getDiffLineStyle(line.type)}
                  >
                    {/* Line number gutter */}
                    <div
                      className="flex-shrink-0 w-10 text-right pr-2 py-0.5 text-xs font-mono select-none border-r"
                      style={{
                        color: 'var(--color-text-tertiary)',
                        borderColor: 'var(--color-border)',
                        backgroundColor: line.type === 'removed'
                          ? 'rgba(239, 68, 68, 0.06)'
                          : 'var(--color-bg-tertiary)',
                      }}
                    >
                      {line.lineNumber > 0 ? line.lineNumber : ''}
                    </div>
                    {/* Diff symbol */}
                    <div
                      className="flex-shrink-0 w-5 text-center py-0.5 text-xs font-mono font-bold"
                      style={{ color: getDiffLineColor(line.type) }}
                    >
                      {getDiffSymbol(line.type)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 py-0.5 pr-3">
                      <pre
                        className="text-xs font-mono whitespace-pre-wrap break-all"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {line.content || '\u00A0'}
                      </pre>
                    </div>
                  </div>
                ))}
                {result.left.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Empty
                    </p>
                  </div>
                )}
              </div>

              {/* Right panel */}
              <div className="overflow-x-auto scrollbar-thin max-h-[600px] overflow-y-auto">
                {result.right.map((line, i) => (
                  <div
                    key={`right-${i}`}
                    className="flex"
                    style={getDiffLineStyle(line.type)}
                  >
                    {/* Line number gutter */}
                    <div
                      className="flex-shrink-0 w-10 text-right pr-2 py-0.5 text-xs font-mono select-none border-r"
                      style={{
                        color: 'var(--color-text-tertiary)',
                        borderColor: 'var(--color-border)',
                        backgroundColor: line.type === 'added'
                          ? 'rgba(34, 197, 94, 0.06)'
                          : 'var(--color-bg-tertiary)',
                      }}
                    >
                      {line.lineNumber > 0 ? line.lineNumber : ''}
                    </div>
                    {/* Diff symbol */}
                    <div
                      className="flex-shrink-0 w-5 text-center py-0.5 text-xs font-mono font-bold"
                      style={{ color: getDiffLineColor(line.type) }}
                    >
                      {getDiffSymbol(line.type)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 py-0.5 pr-3">
                      <pre
                        className="text-xs font-mono whitespace-pre-wrap break-all"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {line.content || '\u00A0'}
                      </pre>
                    </div>
                  </div>
                ))}
                {result.right.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Empty
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
