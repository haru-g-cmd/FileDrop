import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="btn-ghost -ml-3 mb-4 flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            All tools
          </button>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
