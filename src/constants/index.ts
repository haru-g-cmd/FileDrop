import type { Tool, SocialMediaPreset } from '../types';

export const TOOLS: Tool[] = [
  // Image tools
  {
    id: 'compressor',
    name: 'Image Compressor',
    description: 'Reduce file size while keeping quality',
    icon: 'Minimize2',
    accepts: 'image/jpeg,image/png,image/webp',
    path: '/tools/compress',
    category: 'image',
  },
  {
    id: 'converter',
    name: 'Format Converter',
    description: 'Convert between image, document, and data formats',
    icon: 'Repeat',
    accepts: 'image/*',
    path: '/tools/convert',
    category: 'image',
  },
  {
    id: 'resizer',
    name: 'Image Resizer',
    description: 'Resize with presets for every platform',
    icon: 'Maximize2',
    accepts: 'image/jpeg,image/png,image/webp',
    path: '/tools/resize',
    category: 'image',
  },
  {
    id: 'colors',
    name: 'Color Extractor',
    description: 'Pull color palettes from any image',
    icon: 'Palette',
    accepts: 'image/jpeg,image/png,image/webp,image/svg+xml',
    path: '/tools/colors',
    category: 'image',
  },
  // Document tools
  {
    id: 'pdf-merge',
    name: 'PDF Merger',
    description: 'Combine multiple PDFs into one document',
    icon: 'FileStack',
    accepts: 'application/pdf',
    path: '/tools/pdf-merge',
    category: 'document',
  },
  // Utility tools
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Generate QR codes for URLs, text, and Wi-Fi',
    icon: 'QrCode',
    accepts: '',
    path: '/tools/qr-code',
    category: 'utility',
  },
  {
    id: 'hash',
    name: 'Hash Generator',
    description: 'SHA-256, SHA-1, and MD5 checksums for any file',
    icon: 'Hash',
    accepts: '*/*',
    path: '/tools/hash',
    category: 'utility',
  },
  {
    id: 'text-diff',
    name: 'Text Diff',
    description: 'Compare two texts side by side',
    icon: 'GitCompareArrows',
    accepts: 'text/plain',
    path: '/tools/diff',
    category: 'utility',
  },
];

export const SOCIAL_MEDIA_PRESETS: SocialMediaPreset[] = [
  { name: 'Instagram Post', platform: 'instagram', width: 1080, height: 1080 },
  { name: 'Instagram Story', platform: 'instagram', width: 1080, height: 1920 },
  { name: 'Twitter Post', platform: 'twitter', width: 1200, height: 675 },
  { name: 'Twitter Header', platform: 'twitter', width: 1500, height: 500 },
  { name: 'LinkedIn Post', platform: 'linkedin', width: 1200, height: 627 },
  { name: 'LinkedIn Banner', platform: 'linkedin', width: 1584, height: 396 },
  { name: 'Facebook Post', platform: 'facebook', width: 1200, height: 630 },
  { name: 'Facebook Cover', platform: 'facebook', width: 820, height: 312 },
  { name: 'YouTube Thumbnail', platform: 'youtube', width: 1280, height: 720 },
  { name: 'Open Graph', platform: 'web', width: 1200, height: 630 },
  { name: 'Favicon', platform: 'web', width: 32, height: 32 },
  { name: 'App Icon', platform: 'mobile', width: 512, height: 512 },
];

export const IMAGE_FORMAT_OPTIONS = [
  { value: 'image/jpeg', label: 'JPEG', extension: '.jpg' },
  { value: 'image/png', label: 'PNG', extension: '.png' },
  { value: 'image/webp', label: 'WebP', extension: '.webp' },
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
];
