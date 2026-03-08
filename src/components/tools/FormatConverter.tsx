import { useState, useCallback, useEffect, useRef } from 'react';
import { Download, Trash2, ArrowRight, FileText, Image, Database } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import DropZone from '../shared/DropZone';
import { convertImage } from '../../utils/imageUtils';
import { formatFileSize, downloadBlob, getOutputFilename, mimeToExtension, generateId } from '../../utils/fileUtils';
import { IMAGE_FORMAT_OPTIONS } from '../../constants';
import toast from 'react-hot-toast';
import type { ProcessedFile, ConversionCategory } from '../../types';

type CategoryConfig = {
  label: string;
  icon: React.ReactNode;
  description: string;
};

const CATEGORIES: Record<ConversionCategory, CategoryConfig> = {
  image: { label: 'Images', icon: <Image className="w-4 h-4" />, description: 'Convert between image formats' },
  document: { label: 'Documents', icon: <FileText className="w-4 h-4" />, description: 'PDF ↔ Images, DOCX → HTML' },
  data: { label: 'Data', icon: <Database className="w-4 h-4" />, description: 'JSON ↔ CSV, Markdown → HTML' },
};

const DOC_CONVERSIONS = [
  { id: 'img-to-pdf', label: 'Images → PDF', accept: 'image/jpeg,image/png,image/webp', multiple: true },
  { id: 'pdf-to-img', label: 'PDF → Images', accept: 'application/pdf', multiple: false },
  { id: 'docx-to-html', label: 'DOCX → HTML', accept: '.docx', multiple: false },
];

const DATA_CONVERSIONS = [
  { id: 'json-to-csv', label: 'JSON → CSV', accept: '.json', inputLabel: 'Drop a JSON file' },
  { id: 'csv-to-json', label: 'CSV → JSON', accept: '.csv', inputLabel: 'Drop a CSV file' },
  { id: 'md-to-html', label: 'Markdown → HTML', accept: '.md,.markdown,.txt', inputLabel: 'Drop a Markdown file' },
];

export default function FormatConverter() {
  const [category, setCategory] = useState<ConversionCategory>('image');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [docConversion, setDocConversion] = useState('img-to-pdf');
  const [dataConversion, setDataConversion] = useState('json-to-csv');
  const [dataResult, setDataResult] = useState<string | null>(null);
  const [docResult, setDocResult] = useState<{ blobs: Blob[]; names: string[] } | null>(null);
  const resultRef = useRef<HTMLTextAreaElement>(null);

  // Image conversion handlers
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

  const processImageFiles = useCallback(async () => {
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
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} converted`);
    }
  }, [files, targetFormat, quality]);

  // Document conversion handlers
  const processDocFiles = useCallback(async (inputFiles: File[]) => {
    setIsProcessing(true);
    try {
      if (docConversion === 'img-to-pdf') {
        const { imagesToPdf } = await import('../../utils/pdfImageUtils');
        const blob = await imagesToPdf(inputFiles);
        setDocResult({ blobs: [blob], names: ['converted.pdf'] });
        toast.success('PDF created');
      } else if (docConversion === 'pdf-to-img') {
        const { pdfToImages } = await import('../../utils/pdfImageUtils');
        const blobs = await pdfToImages(inputFiles[0]);
        const names = blobs.map((_, i) => `page-${i + 1}.png`);
        setDocResult({ blobs, names });
        toast.success(`${blobs.length} page${blobs.length > 1 ? 's' : ''} extracted`);
      } else if (docConversion === 'docx-to-html') {
        const mammoth = await import('mammoth');
        const arrayBuffer = await inputFiles[0].arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const blob = new Blob([result.value], { type: 'text/html' });
        setDocResult({ blobs: [blob], names: [getOutputFilename(inputFiles[0].name, '', '.html')] });
        toast.success('DOCX converted to HTML');
      }
    } catch (err) {
      toast.error('Conversion failed');
      console.error(err);
    }
    setIsProcessing(false);
  }, [docConversion]);

  // Data conversion handlers
  const processDataFile = useCallback(async (inputFiles: File[]) => {
    setIsProcessing(true);
    try {
      const text = await inputFiles[0].text();
      const { jsonToCsv, csvToJson, markdownToHtml } = await import('../../utils/dataFormatUtils');

      if (dataConversion === 'json-to-csv') {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : [data];
        setDataResult(jsonToCsv(arr));
      } else if (dataConversion === 'csv-to-json') {
        const result = csvToJson(text);
        setDataResult(JSON.stringify(result, null, 2));
      } else if (dataConversion === 'md-to-html') {
        setDataResult(markdownToHtml(text));
      }
      toast.success('Conversion complete');
    } catch (err) {
      toast.error('Conversion failed — check your file format');
      console.error(err);
    }
    setIsProcessing(false);
  }, [dataConversion]);

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
      downloadBlob(blob, 'converted.zip');
    }
  }, [files, handleDownload, targetFormat]);

  const clearAll = useCallback(() => {
    files.forEach(f => {
      URL.revokeObjectURL(f.originalUrl);
      if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
    });
    setFiles([]);
    setDataResult(null);
    setDocResult(null);
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
  const currentFormatLabel = IMAGE_FORMAT_OPTIONS.find(f => f.value === targetFormat)?.label || targetFormat;
  const selectedDocConv = DOC_CONVERSIONS.find(c => c.id === docConversion)!;
  const selectedDataConv = DATA_CONVERSIONS.find(c => c.id === dataConversion)!;

  return (
    <ToolLayout
      title="Format Converter"
      description="Convert between image, document, and data formats. Everything runs locally."
    >
      {/* Category tabs */}
      <div
        className="flex gap-1 p-1 rounded-lg mb-6"
        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        {(Object.entries(CATEGORIES) as [ConversionCategory, CategoryConfig][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setCategory(key); clearAll(); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md flex-1 justify-center transition-all duration-150
              ${category === key
                ? 'bg-[var(--color-bg)] shadow-sm'
                : 'hover:bg-[var(--color-bg)]'
              }`}
            style={{ color: category === key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
          >
            {cfg.icon}
            <span className="hidden sm:inline">{cfg.label}</span>
          </button>
        ))}
      </div>

      {/* === IMAGE CATEGORY === */}
      {category === 'image' && (
        <>
          {files.length === 0 ? (
            <DropZone
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/bmp"
              multiple
              onFilesSelected={handleFilesSelected}
              label="Drop images to convert"
              sublabel="Supports JPEG, PNG, WebP, GIF, SVG, BMP"
            />
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="card p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Convert to
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {IMAGE_FORMAT_OPTIONS.map(format => (
                        <button
                          key={format.value}
                          onClick={() => setTargetFormat(format.value)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border
                            ${targetFormat === format.value
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                              : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                            }`}
                          style={{
                            color: targetFormat === format.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {targetFormat !== 'image/png' && (
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Quality: {quality}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={quality}
                        onChange={e => setQuality(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--color-accent)]"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={processImageFiles} disabled={isProcessing} className="btn-primary">
                      {isProcessing ? 'Converting...' : `Convert to ${currentFormatLabel}`}
                    </button>
                    {doneFiles.length > 0 && (
                      <button onClick={handleDownloadAll} className="btn-secondary">
                        <Download className="w-4 h-4" />
                        {doneFiles.length > 1 ? 'Download All' : 'Download'}
                      </button>
                    )}
                    <button onClick={clearAll} className="btn-ghost p-2 ml-auto text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* File list */}
              <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {files.map((file) => {
                  const originalExt = file.originalFile.name.split('.').pop()?.toUpperCase() || '?';
                  return (
                    <div key={file.id} className="flex items-center gap-3 px-4 py-3">
                      <img
                        src={file.originalUrl}
                        alt=""
                        className="w-10 h-10 rounded object-cover border"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {file.originalFile.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                            {originalExt}
                          </span>
                          <ArrowRight className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
                          <span
                            className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: file.status === 'done' ? 'var(--color-accent-muted)' : 'var(--color-bg-tertiary)',
                              color: file.status === 'done' ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                            }}
                          >
                            {currentFormatLabel}
                          </span>
                          {file.processedSize != null && (
                            <span className="text-xs ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
                              {formatFileSize(file.originalSize)} → {formatFileSize(file.processedSize)}
                            </span>
                          )}
                        </div>
                      </div>
                      {file.status === 'done' && (
                        <button onClick={() => handleDownload(file)} className="btn-ghost p-2">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {file.status === 'processing' && (
                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* === DOCUMENT CATEGORY === */}
      {category === 'document' && (
        <div className="space-y-4">
          {/* Conversion type selector */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Conversion type
            </label>
            <div className="flex gap-2 flex-wrap">
              {DOC_CONVERSIONS.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setDocConversion(conv.id); setDocResult(null); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border
                    ${docConversion === conv.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                    }`}
                  style={{
                    color: docConversion === conv.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  {conv.label}
                </button>
              ))}
            </div>
          </div>

          {!docResult ? (
            <DropZone
              accept={selectedDocConv.accept}
              multiple={selectedDocConv.multiple}
              onFilesSelected={(f) => processDocFiles(f)}
              label={`Drop ${selectedDocConv.label.split(' → ')[0].toLowerCase()} files`}
              sublabel={isProcessing ? 'Processing...' : undefined}
            />
          ) : (
            <div className="space-y-3">
              <div className="card p-4">
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {docResult.blobs.length} file{docResult.blobs.length > 1 ? 's' : ''} ready
                </p>
                <div className="flex gap-2 flex-wrap">
                  {docResult.blobs.map((blob, i) => (
                    <button
                      key={i}
                      onClick={() => downloadBlob(blob, docResult.names[i])}
                      className="btn-secondary text-sm"
                    >
                      <Download className="w-4 h-4" />
                      {docResult.names[i]}
                    </button>
                  ))}
                  {docResult.blobs.length > 1 && (
                    <button
                      onClick={async () => {
                        const JSZip = (await import('jszip')).default;
                        const zip = new JSZip();
                        docResult.blobs.forEach((b, i) => zip.file(docResult.names[i], b));
                        const blob = await zip.generateAsync({ type: 'blob' });
                        downloadBlob(blob, 'converted.zip');
                      }}
                      className="btn-primary text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download All (ZIP)
                    </button>
                  )}
                </div>
              </div>
              <button onClick={clearAll} className="btn-ghost text-sm text-red-500">
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* === DATA CATEGORY === */}
      {category === 'data' && (
        <div className="space-y-4">
          {/* Conversion type selector */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Conversion type
            </label>
            <div className="flex gap-2 flex-wrap">
              {DATA_CONVERSIONS.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setDataConversion(conv.id); setDataResult(null); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 border
                    ${dataConversion === conv.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                    }`}
                  style={{
                    color: dataConversion === conv.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  {conv.label}
                </button>
              ))}
            </div>
          </div>

          {!dataResult ? (
            <DropZone
              accept={selectedDataConv.accept}
              onFilesSelected={(f) => processDataFile(f)}
              label={selectedDataConv.inputLabel}
              sublabel={isProcessing ? 'Processing...' : undefined}
            />
          ) : (
            <div className="space-y-3">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Result
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(dataResult);
                        toast.success('Copied to clipboard');
                      }}
                      className="btn-ghost text-xs"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        const ext = dataConversion === 'json-to-csv' ? '.csv'
                          : dataConversion === 'csv-to-json' ? '.json'
                          : '.html';
                        const mime = dataConversion === 'json-to-csv' ? 'text/csv'
                          : dataConversion === 'csv-to-json' ? 'application/json'
                          : 'text/html';
                        const blob = new Blob([dataResult], { type: mime });
                        downloadBlob(blob, `converted${ext}`);
                      }}
                      className="btn-ghost text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>
                <textarea
                  ref={resultRef}
                  readOnly
                  value={dataResult}
                  className="w-full h-64 font-mono text-xs p-3 rounded-lg border resize-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <button onClick={clearAll} className="btn-ghost text-sm text-red-500">
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
