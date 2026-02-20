import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import Layout from './components/layout/Layout';
import Home from './components/Home';

// Lazy load tool pages for code splitting
const ImageCompressor = lazy(() => import('./components/tools/ImageCompressor'));
const FormatConverter = lazy(() => import('./components/tools/FormatConverter'));
const ImageResizer = lazy(() => import('./components/tools/ImageResizer'));
const ColorExtractor = lazy(() => import('./components/tools/ColorExtractor'));
const PdfMerger = lazy(() => import('./components/tools/PdfMerger'));

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading tool...</p>
      </div>
    </div>
  );
}

// 404 page
function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-6xl font-black gradient-text mb-4">404</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
          This page doesn't exist.
        </p>
        <a href="/" className="btn-primary">
          Go Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg, #1f2937)',
            color: 'var(--toast-color, #f3f4f6)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 20px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="/tools/compress"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ImageCompressor />
              </Suspense>
            }
          />
          <Route
            path="/tools/convert"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <FormatConverter />
              </Suspense>
            }
          />
          <Route
            path="/tools/resize"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ImageResizer />
              </Suspense>
            }
          />
          <Route
            path="/tools/colors"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ColorExtractor />
              </Suspense>
            }
          />
          <Route
            path="/tools/pdf-merge"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PdfMerger />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
