export interface ProcessedFile {
  id: string;
  originalFile: File;
  originalUrl: string;
  originalSize: number;
  processedBlob?: Blob;
  processedUrl?: string;
  processedSize?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CompressionOptions {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

export interface ConversionOptions {
  format: string;
  quality: number;
}

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  name: string;
}

export interface SocialMediaPreset {
  name: string;
  platform: string;
  width: number;
  height: number;
}

export type ToolId =
  | 'compressor'
  | 'converter'
  | 'resizer'
  | 'colors'
  | 'pdf-merge'
  | 'qr-generator'
  | 'hash'
  | 'text-diff';

export type ToolCategory = 'image' | 'document' | 'utility';

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  accepts: string;
  path: string;
  category: ToolCategory;
}

export type ConversionCategory = 'image' | 'document' | 'data';

export interface QROptions {
  text: string;
  size: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  foreground: string;
  background: string;
}

export interface HashResult {
  algorithm: string;
  hash: string;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}
