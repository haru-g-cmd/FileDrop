import { Link } from 'react-router-dom';
import {
  Minimize2, Repeat, Maximize2, Palette, FileStack,
  QrCode, Hash, GitCompareArrows, ArrowRight, Shield
} from 'lucide-react';
import { TOOLS } from '../constants';
import type { ToolCategory } from '../types';

const iconMap: Record<string, React.ReactNode> = {
  Minimize2: <Minimize2 className="w-4 h-4" />,
  Repeat: <Repeat className="w-4 h-4" />,
  Maximize2: <Maximize2 className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  FileStack: <FileStack className="w-4 h-4" />,
  QrCode: <QrCode className="w-4 h-4" />,
  Hash: <Hash className="w-4 h-4" />,
  GitCompareArrows: <GitCompareArrows className="w-4 h-4" />,
};

const categoryLabels: Record<ToolCategory, string> = {
  image: 'Image Tools',
  document: 'Document Tools',
  utility: 'Utilities',
};

const categoryOrder: ToolCategory[] = ['image', 'document', 'utility'];

export default function Home() {
  const groupedTools = categoryOrder.map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    tools: TOOLS.filter(t => t.category === cat),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
      {/* Hero */}
      <div className="mb-12">
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          File tools that run in your browser.
        </h1>
        <p className="text-base sm:text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Compress, convert, resize, and more. Nothing leaves your device.
        </p>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <Shield className="w-3 h-3" />
          <span>Zero uploads · 100% client-side · No sign-up</span>
        </div>
      </div>

      {/* Tool groups */}
      <div className="space-y-8">
        {groupedTools.map(({ category, label, tools }) => (
          <div key={category}>
            <h2
              className="text-xs font-medium uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {label}
            </h2>
            <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="flex items-center gap-4 px-4 py-3.5 group transition-colors duration-150 hover:bg-[var(--color-bg-secondary)] first:rounded-t-lg last:rounded-b-lg"
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--color-accent-muted)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {iconMap[tool.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {tool.name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
