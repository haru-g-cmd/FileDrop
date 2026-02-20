import { Shield, Zap, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/5 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Trust badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 mb-3">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">100% Private</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All processing happens locally in your browser. Your files never leave your device.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 mb-3">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Lightning Fast</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No uploads, no downloads from servers. Processing happens instantly using browser APIs.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 mb-3">
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No Sign Up</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No accounts, no limits, no tracking. Just open and start processing your files.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-100 dark:border-white/5 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Built with React, TypeScript, and Canvas API.
            Runs entirely in the browser. No server needed.
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">
            &copy; {new Date().getFullYear()} FileDrop. Open source and free forever.
          </p>
        </div>
      </div>
    </footer>
  );
}
