import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Minimize2, Repeat, Maximize2, Palette, FileStack,
  Shield, Zap, WifiOff, ArrowRight, Sparkles
} from 'lucide-react';
import { TOOLS } from '../constants';

const iconMap: Record<string, React.ReactNode> = {
  Minimize2: <Minimize2 className="w-6 h-6" />,
  Repeat: <Repeat className="w-6 h-6" />,
  Maximize2: <Maximize2 className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  FileStack: <FileStack className="w-6 h-6" />,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-brand-500/20 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-cyan-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 mb-8"
            >
              <WifiOff className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                100% Offline · Zero Uploads
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              Process Files{' '}
              <span className="gradient-text">Privately,</span>
              <br />
              Right in Your Browser
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Compress images, convert formats, resize for social media, extract color palettes, 
              and merge PDFs. Nothing gets uploaded. Your files stay on your device the entire time.
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="#tools" className="btn-primary text-base px-8 py-4">
                <Sparkles className="w-5 h-5" />
                Start Processing
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            {[
              { step: '1', title: 'Drop Your Files', desc: 'Drag & drop or click to browse', icon: '📂' },
              { step: '2', title: 'Process Locally', desc: 'Everything runs in your browser', icon: '⚡' },
              { step: '3', title: 'Download Results', desc: 'Get your processed files instantly', icon: '💾' },
            ].map((item) => (
              <div key={item.step} className="text-center p-6">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What You Can Do
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Five tools that handle the file tasks you run into all the time.
            Everything runs locally in your browser.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {TOOLS.map((tool) => (
            <motion.div key={tool.id} variants={itemVariants}>
              <Link
                to={tool.path}
                className="card group block p-6 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {iconMap[tool.icon]}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-500 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  {tool.longDescription}
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 group-hover:gap-3 transition-all">
                  <span>Use tool</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Why FileDrop card */}
          <motion.div variants={itemVariants}>
            <div className="card p-6 h-full bg-gradient-to-br from-brand-500/5 to-purple-500/5 dark:from-brand-500/10 dark:to-purple-500/10 border-brand-200 dark:border-brand-500/20">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Why FileDrop?
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: <Shield className="w-4 h-4 text-emerald-500" />, text: 'Files never uploaded to any server' },
                  { icon: <Zap className="w-4 h-4 text-amber-500" />, text: 'Instant processing with browser APIs' },
                  { icon: <WifiOff className="w-4 h-4 text-blue-500" />, text: 'Works completely offline' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5">{item.icon}</div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Tech stack section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-100 dark:border-white/5">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6">
            Built With Modern Web Technologies
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {['React', 'TypeScript', 'Canvas API', 'Web Workers', 'Tailwind CSS', 'Framer Motion', 'pdf-lib'].map(tech => (
              <span
                key={tech}
                className="px-4 py-2 text-xs font-mono font-medium text-gray-500 dark:text-gray-400 
                           bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
