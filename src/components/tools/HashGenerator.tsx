import { useState, useCallback } from 'react';
import { Copy, Check, FileText, RotateCcw, Hash, ToggleLeft, ToggleRight } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import DropZone from '../shared/DropZone';
import { formatFileSize } from '../../utils/fileUtils';
import toast from 'react-hot-toast';
import SparkMD5 from 'spark-md5';
import type { HashResult } from '../../types';

type InputMode = 'file' | 'text';

interface FileInfo {
  name: string;
  size: number;
}

async function computeWebCryptoHash(
  algorithm: string,
  buffer: ArrayBuffer
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function computeMD5(buffer: ArrayBuffer): string {
  const spark = new SparkMD5.ArrayBuffer();
  spark.append(buffer);
  return spark.end();
}

async function computeAllHashes(buffer: ArrayBuffer): Promise<HashResult[]> {
  const [md5, sha1, sha256, sha512] = await Promise.all([
    Promise.resolve(computeMD5(buffer)),
    computeWebCryptoHash('SHA-1', buffer),
    computeWebCryptoHash('SHA-256', buffer),
    computeWebCryptoHash('SHA-512', buffer),
  ]);

  return [
    { algorithm: 'MD5', hash: md5 },
    { algorithm: 'SHA-1', hash: sha1 },
    { algorithm: 'SHA-256', hash: sha256 },
    { algorithm: 'SHA-512', hash: sha512 },
  ];
}

export default function HashGenerator() {
  const [mode, setMode] = useState<InputMode>('file');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [textInput, setTextInput] = useState('');

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const file = files[0];
    setFileInfo({ name: file.name, size: file.size });
    setHashes([]);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const results = await computeAllHashes(buffer);
      setHashes(results);
      toast.success('Hashes computed!');
    } catch {
      toast.error('Failed to compute hashes');
    }

    setIsProcessing(false);
  }, []);

  const handleTextHash = useCallback(async () => {
    if (!textInput.trim()) {
      toast.error('Enter some text to hash');
      return;
    }

    setIsProcessing(true);

    try {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(textInput).buffer as ArrayBuffer;
      const results = await computeAllHashes(buffer);
      setHashes(results);
      toast.success('Hashes computed!');
    } catch {
      toast.error('Failed to compute hashes');
    }

    setIsProcessing(false);
  }, [textInput]);

  const handleCopy = useCallback(async (hash: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedIndex(index);
      toast.success('Hash copied!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const handleReset = useCallback(() => {
    setFileInfo(null);
    setHashes([]);
    setTextInput('');
    setCopiedIndex(null);
  }, []);

  const showResults = hashes.length > 0;
  const showDropZone = mode === 'file' && !fileInfo && !isProcessing;
  const showTextInput = mode === 'text' && !showResults;

  return (
    <ToolLayout
      title="Hash Generator"
      description="Compute MD5, SHA-1, SHA-256, and SHA-512 hashes for files or text using Web Crypto API."
    >
      <div className="space-y-5">
        {/* Mode toggle */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Input mode:
            </span>
            <button
              onClick={() => { setMode('file'); handleReset(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: mode === 'file' ? 'var(--color-accent-muted)' : 'transparent',
                color: mode === 'file' ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              }}
            >
              {mode === 'file' ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              File
            </button>
            <button
              onClick={() => { setMode('text'); handleReset(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: mode === 'text' ? 'var(--color-accent-muted)' : 'transparent',
                color: mode === 'text' ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              }}
            >
              {mode === 'text' ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              Text
            </button>
          </div>
        </div>

        {/* File drop zone */}
        {showDropZone && (
          <DropZone
            accept="*/*"
            onFilesSelected={handleFilesSelected}
            label="Drop a file here to compute hashes"
            sublabel="Any file type supported"
            icon={<Hash className="w-6 h-6" style={{ color: 'var(--color-text-tertiary)' }} />}
          />
        )}

        {/* Text input */}
        {showTextInput && (
          <div className="card p-5 space-y-4">
            <label
              className="block text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Enter text to hash
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste or type text here..."
              className="input-field resize-none font-mono text-sm"
              rows={6}
            />
            <button
              onClick={handleTextHash}
              disabled={isProcessing || !textInput.trim()}
              className="btn-primary"
            >
              <Hash className="w-4 h-4" />
              {isProcessing ? 'Computing...' : 'Compute Hashes'}
            </button>
          </div>
        )}

        {/* Processing spinner */}
        {isProcessing && mode === 'file' && (
          <div className="card p-8 flex flex-col items-center gap-3">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Computing hashes...
            </p>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-4">
            {/* File info header */}
            {fileInfo && mode === 'file' && (
              <div
                className="card p-4 flex items-center gap-3"
              >
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {fileInfo.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {formatFileSize(fileInfo.size)}
                  </p>
                </div>
                <button onClick={handleReset} className="btn-secondary text-sm">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Select another file
                </button>
              </div>
            )}

            {/* Text info header */}
            {mode === 'text' && (
              <div className="card p-4 flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Text input ({textInput.length} characters)
                  </p>
                </div>
                <button onClick={handleReset} className="btn-secondary text-sm">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Start over
                </button>
              </div>
            )}

            {/* Hash results */}
            <div className="card divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {hashes.map((result, index) => (
                <div
                  key={result.algorithm}
                  className="p-4 flex items-start gap-4"
                  style={{
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex-shrink-0 w-16 pt-0.5">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {result.algorithm}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-mono break-all leading-relaxed select-all"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {result.hash}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(result.hash, index)}
                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors duration-150 hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    title={`Copy ${result.algorithm} hash`}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    ) : (
                      <Copy className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
