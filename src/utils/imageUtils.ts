import type { ImageDimensions, CompressionOptions, ConversionOptions, ResizeOptions } from '../types';

export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to compress image'));
      },
      format,
      quality
    );
  });
}

export async function compressImage(file: File, options: CompressionOptions): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const canvas = document.createElement('canvas');
  let { width, height } = img;

  if (options.maxWidth && width > options.maxWidth) {
    height = Math.round((height * options.maxWidth) / width);
    width = options.maxWidth;
  }
  if (options.maxHeight && height > options.maxHeight) {
    width = Math.round((width * options.maxHeight) / height);
    height = options.maxHeight;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const originalSize = file.size;
  const requestedFormat = options.format || 'image/jpeg';

  // For PNG: since quality parameter is ignored (lossless), try WebP as an
  // intermediate lossy format that still supports transparency
  if (requestedFormat === 'image/png') {
    // Try WebP with the requested quality first (keeps transparency)
    const webpBlob = await canvasToBlob(canvas, 'image/webp', options.quality / 100);
    if (webpBlob.size < originalSize) {
      // Re-encode the smaller WebP back to PNG won't help — just output it as
      // WebP-quality PNG by keeping the WebP blob but labeled via the caller.
      // Actually: the caller expects the same format, so try a standard PNG
      // export and if it's still bigger, fall back to WebP output.
      const pngBlob = await canvasToBlob(canvas, 'image/png');
      if (pngBlob.size <= originalSize) return pngBlob;
      // PNG couldn't shrink, return WebP (smaller) — the caller handles naming
      return webpBlob;
    }
    // WebP was also bigger — return original unchanged
    return file;
  }

  // For lossy formats (JPEG, WebP): try requested quality first
  let blob = await canvasToBlob(canvas, requestedFormat, options.quality / 100);

  if (blob.size < originalSize) return blob;

  // If still larger, try progressively lower quality in steps of 0.05
  let q = (options.quality / 100) - 0.05;
  while (q >= 0.1 && blob.size >= originalSize) {
    blob = await canvasToBlob(canvas, requestedFormat, q);
    q -= 0.05;
  }

  if (blob.size < originalSize) return blob;

  // Nothing worked — return the original file so we never increase size
  return file;
}

export async function convertImage(file: File, options: ConversionOptions): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // For JPEG, fill white background (no transparency support)
  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const quality = options.format === 'image/png' ? undefined : options.quality / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert image'));
      },
      options.format,
      quality
    );
  });
}

export async function resizeImage(file: File, options: ResizeOptions): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  let targetWidth = options.width;
  let targetHeight = options.height;

  if (options.maintainAspectRatio) {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    if (targetWidth / targetHeight > aspectRatio) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else {
      targetHeight = Math.round(targetWidth / aspectRatio);
    }
  }

  // Use multi-step downscaling for better quality
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (targetWidth < img.naturalWidth / 2 || targetHeight < img.naturalHeight / 2) {
    // Step-down approach for large reductions
    let currentWidth = img.naturalWidth;
    let currentHeight = img.naturalHeight;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    let source: CanvasImageSource = img;

    while (currentWidth / 2 > targetWidth) {
      currentWidth = Math.round(currentWidth / 2);
      currentHeight = Math.round(currentHeight / 2);
      tempCanvas.width = currentWidth;
      tempCanvas.height = currentHeight;
      tempCtx.drawImage(source, 0, 0, currentWidth, currentHeight);
      source = tempCanvas;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  } else {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }

  // Detect output format from original file
  const format = file.type === 'image/png' ? 'image/png' : 
                 file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const quality = format === 'image/png' ? undefined : 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to resize image'));
      },
      format,
      quality
    );
  });
}
