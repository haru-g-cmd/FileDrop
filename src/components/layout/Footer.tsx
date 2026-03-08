import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="border-t py-6"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <Shield className="w-3 h-3" />
          <span>All processing happens in your browser. Files never leave your device.</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          &copy; {new Date().getFullYear()} FileDrop
        </p>
      </div>
    </footer>
  );
}
