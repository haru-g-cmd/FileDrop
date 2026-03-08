import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import Layout from './components/layout/Layout';
import Home from './components/Home';

const ImageCompressor = lazy(() => import('./components/tools/ImageCompressor'));
const FormatConverter = lazy(() => import('./components/tools/FormatConverter'));
const ImageResizer = lazy(() => import('./components/tools/ImageResizer'));
const ColorExtractor = lazy(() => import('./components/tools/ColorExtractor'));
const PdfMerger = lazy(() => import('./components/tools/PdfMerger'));
const QRGenerator = lazy(() => import('./components/tools/QRGenerator'));
const HashGenerator = lazy(() => import('./components/tools/HashGenerator'));
const TextDiff = lazy(() => import('./components/tools/TextDiff'));

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-5xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>404</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          This page doesn&apos;t exist.
        </p>
        <a href="/" className="btn-primary">Go Home</a>
      </div>
    </div>
  );
}

function ToolRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            padding: '10px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/tools/compress" element={<ToolRoute><ImageCompressor /></ToolRoute>} />
          <Route path="/tools/convert" element={<ToolRoute><FormatConverter /></ToolRoute>} />
          <Route path="/tools/resize" element={<ToolRoute><ImageResizer /></ToolRoute>} />
          <Route path="/tools/colors" element={<ToolRoute><ColorExtractor /></ToolRoute>} />
          <Route path="/tools/pdf-merge" element={<ToolRoute><PdfMerger /></ToolRoute>} />
          <Route path="/tools/qr-code" element={<ToolRoute><QRGenerator /></ToolRoute>} />
          <Route path="/tools/hash" element={<ToolRoute><HashGenerator /></ToolRoute>} />
          <Route path="/tools/diff" element={<ToolRoute><TextDiff /></ToolRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
