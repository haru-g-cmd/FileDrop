import type { Tool, SocialMediaPreset } from '../types';

export const TOOLS: Tool[] = [
  {
    id: 'compressor',
    name: 'Image Compressor',
    description: 'Reduce file size while preserving quality',
    longDescription: 'Smart compression with live before/after comparison. See exactly how your image looks at different quality levels with an interactive slider.',
    icon: 'Minimize2',
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    accepts: 'image/jpeg,image/png,image/webp',
    path: '/tools/compress',
  },
  {
    id: 'converter',
    name: 'Format Converter',
    description: 'Convert between PNG, JPEG, and WebP',
    longDescription: 'Batch convert images between formats instantly. Perfect for optimizing web assets or meeting platform requirements.',
    icon: 'Repeat',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-600',
    accepts: 'image/jpeg,image/png,image/webp',
    path: '/tools/convert',
  },
  {
    id: 'resizer',
    name: 'Image Resizer',
    description: 'Resize with smart presets for every platform',
    longDescription: 'Resize images to exact dimensions with presets for Instagram, Twitter, LinkedIn, Facebook, and more. Maintains aspect ratio intelligently.',
    icon: 'Maximize2',
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-600',
    accepts: 'image/jpeg,image/png,image/webp',
    path: '/tools/resize',
  },
  {
    id: 'colors',
    name: 'Color Extractor',
    description: 'Extract beautiful palettes from any image',
    longDescription: 'Pull the dominant colors from any image. Get hex codes, RGB values, and copy-ready color palettes for your designs.',
    icon: 'Palette',
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-600',
    accepts: 'image/jpeg,image/png,image/webp,image/svg+xml',
    path: '/tools/colors',
  },
  {
    id: 'pdf-merge',
    name: 'PDF Merger',
    description: 'Combine multiple PDFs into one document',
    longDescription: 'Merge PDF files in any order. Drag to rearrange, preview pages, and download a single combined document. All processing happens locally.',
    icon: 'FileStack',
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-600',
    accepts: 'application/pdf',
    path: '/tools/pdf-merge',
  },
];

export const SOCIAL_MEDIA_PRESETS: SocialMediaPreset[] = [
  { name: 'Instagram Post', platform: 'instagram', width: 1080, height: 1080, icon: '📸' },
  { name: 'Instagram Story', platform: 'instagram', width: 1080, height: 1920, icon: '📱' },
  { name: 'Twitter Post', platform: 'twitter', width: 1200, height: 675, icon: '🐦' },
  { name: 'Twitter Header', platform: 'twitter', width: 1500, height: 500, icon: '🐦' },
  { name: 'LinkedIn Post', platform: 'linkedin', width: 1200, height: 627, icon: '💼' },
  { name: 'LinkedIn Banner', platform: 'linkedin', width: 1584, height: 396, icon: '💼' },
  { name: 'Facebook Post', platform: 'facebook', width: 1200, height: 630, icon: '📘' },
  { name: 'Facebook Cover', platform: 'facebook', width: 820, height: 312, icon: '📘' },
  { name: 'YouTube Thumbnail', platform: 'youtube', width: 1280, height: 720, icon: '▶️' },
  { name: 'Open Graph', platform: 'web', width: 1200, height: 630, icon: '🌐' },
  { name: 'Favicon', platform: 'web', width: 32, height: 32, icon: '⭐' },
  { name: 'App Icon', platform: 'mobile', width: 512, height: 512, icon: '📲' },
];

export const FORMAT_OPTIONS = [
  { value: 'image/jpeg', label: 'JPEG', extension: '.jpg', description: 'Best for photos' },
  { value: 'image/png', label: 'PNG', extension: '.png', description: 'Best for transparency' },
  { value: 'image/webp', label: 'WebP', extension: '.webp', description: 'Best for web' },
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
