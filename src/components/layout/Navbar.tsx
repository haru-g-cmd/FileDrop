import { Link } from 'react-router-dom';
import { Sun, Moon, Github, Droplets } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function Navbar() {
  const { isDark, toggle } = useTheme();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <Droplets className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              FileDrop
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <a
              href="https://github.com/haru-g-cmd/filedrop"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost p-2 rounded-lg"
              title="View source on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={toggle}
              className="btn-ghost p-2 rounded-lg"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
