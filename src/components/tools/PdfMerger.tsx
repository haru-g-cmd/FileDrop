import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Download, Trash2, GripVertical, FileText, Sparkles, Plus } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import DropZone from '../shared/DropZone';
import { mergePdfs, getPdfPageCount } from '../../utils/pdfUtils';
import { formatFileSize, downloadBlob, generateId } from '../../utils/fileUtils';
import toast from 'react-hot-toast';

interface PdfFile {
  id: string;
  file: File;
  pageCount: number | null;
  isLoadingPages: boolean;
}

export default function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newPdfs: PdfFile[] = files.map(f => ({
      id: generateId(),
      file: f,
      pageCount: null,
      isLoadingPages: true,
    }));
    setPdfFiles(prev => [...prev, ...newPdfs]);
    setMergedBlob(null);

    // Load page counts in background
    for (const pdf of newPdfs) {
      try {
        const pageCount = await getPdfPageCount(pdf.file);
        setPdfFiles(prev =>
          prev.map(p => p.id === pdf.id ? { ...p, pageCount, isLoadingPages: false } : p)
        );
      } catch {
        setPdfFiles(prev =>
          prev.map(p => p.id === pdf.id ? { ...p, isLoadingPages: false } : p)
        );
      }
    }
  }, []);

  const handleMerge = useCallback(async () => {
    if (pdfFiles.length < 2) {
      toast.error('Need at least 2 PDFs to merge');
      return;
    }

    setIsProcessing(true);
    try {
      const blob = await mergePdfs(pdfFiles.map(p => p.file));
      setMergedBlob(blob);
      toast.success('PDFs merged successfully!');
    } catch {
      toast.error('Failed to merge PDFs');
    }
    setIsProcessing(false);
  }, [pdfFiles]);

  const handleDownload = useCallback(() => {
    if (mergedBlob) {
      downloadBlob(mergedBlob, 'merged-document.pdf');
    }
  }, [mergedBlob]);

  const removeFile = useCallback((id: string) => {
    setPdfFiles(prev => prev.filter(p => p.id !== id));
    setMergedBlob(null);
  }, []);

  const clearAll = useCallback(() => {
    setPdfFiles([]);
    setMergedBlob(null);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  const totalPages = pdfFiles.reduce((sum, p) => sum + (p.pageCount || 0), 0);
  const totalSize = pdfFiles.reduce((sum, p) => sum + p.file.size, 0);

  return (
    <ToolLayout
      title="PDF Merger"
      description="Combine multiple PDF files into a single document. Drag to reorder pages before merging."
      gradient="from-orange-500 to-amber-600"
    >
      {pdfFiles.length === 0 ? (
        <DropZone
          accept="application/pdf"
          multiple
          onFilesSelected={handleFilesSelected}
          label="Drop PDF files to merge"
          sublabel="Select 2 or more PDF files • Up to 50MB each"
        />
      ) : (
        <div className="space-y-6">
          {/* Stats & controls */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-500">Files</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{pdfFiles.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Pages</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{totalPages}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Size</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatFileSize(totalSize)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleMerge}
                  disabled={isProcessing || pdfFiles.length < 2}
                  className="btn-primary"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Merging...' : 'Merge PDFs'}
                </button>
                <button onClick={clearAll} className="btn-ghost text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add more */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'application/pdf';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) handleFilesSelected(Array.from(target.files));
                  };
                  input.click();
                }}
                className="btn-ghost text-sm"
              >
                <Plus className="w-4 h-4" />
                Add more PDFs
              </button>
            </div>
          </div>

          {/* Download result */}
          <AnimatePresence>
            {mergedBlob && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-6 text-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-500/20 mb-3">
                  <FileText className="w-7 h-7 text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Merge Complete!
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {totalPages} pages • {formatFileSize(mergedBlob.size)}
                </p>
                <button onClick={handleDownload} className="btn-primary">
                  <Download className="w-4 h-4" />
                  Download Merged PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reorderable file list */}
          <div>
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5" />
              Drag to reorder before merging
            </p>

            <Reorder.Group
              axis="y"
              values={pdfFiles}
              onReorder={(newOrder) => { setPdfFiles(newOrder); setMergedBlob(null); }}
              className="space-y-3"
            >
              {pdfFiles.map((pdf, index) => (
                <Reorder.Item key={pdf.id} value={pdf}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card p-4 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {index + 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                          {pdf.file.name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{formatFileSize(pdf.file.size)}</span>
                          {pdf.isLoadingPages ? (
                            <span className="text-xs text-gray-400">Loading...</span>
                          ) : pdf.pageCount !== null ? (
                            <span className="text-xs text-gray-400">
                              {pdf.pageCount} page{pdf.pageCount !== 1 ? 's' : ''}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        onClick={() => removeFile(pdf.id)}
                        className="btn-ghost p-2 text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
