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
  format: 'image/jpeg' | 'image/png' | 'image/webp';
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
  icon: string;
}

export type ToolId = 'compressor' | 'converter' | 'resizer' | 'colors' | 'pdf-merge';

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  color: string;
  gradient: string;
  accepts: string;
  path: string;
}
