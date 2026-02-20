import type { ExtractedColor } from '../types';

// Nearest named color mapping
const COLOR_NAMES: [string, number, number, number][] = [
  ['Red', 255, 0, 0], ['Crimson', 220, 20, 60], ['Coral', 255, 127, 80],
  ['Orange', 255, 165, 0], ['Gold', 255, 215, 0], ['Yellow', 255, 255, 0],
  ['Lime', 0, 255, 0], ['Green', 0, 128, 0], ['Emerald', 80, 200, 120],
  ['Teal', 0, 128, 128], ['Cyan', 0, 255, 255], ['Sky Blue', 135, 206, 235],
  ['Blue', 0, 0, 255], ['Royal Blue', 65, 105, 225], ['Navy', 0, 0, 128],
  ['Indigo', 75, 0, 130], ['Purple', 128, 0, 128], ['Violet', 238, 130, 238],
  ['Magenta', 255, 0, 255], ['Pink', 255, 192, 203], ['Hot Pink', 255, 105, 180],
  ['Rose', 255, 0, 127], ['Brown', 139, 69, 19], ['Chocolate', 210, 105, 30],
  ['Tan', 210, 180, 140], ['Beige', 245, 245, 220], ['Ivory', 255, 255, 240],
  ['White', 255, 255, 255], ['Silver', 192, 192, 192], ['Gray', 128, 128, 128],
  ['Charcoal', 54, 69, 79], ['Black', 0, 0, 0],
];

function getColorName(r: number, g: number, b: number): string {
  let minDist = Infinity;
  let name = 'Unknown';
  for (const [n, cr, cg, cb] of COLOR_NAMES) {
    const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
    if (dist < minDist) {
      minDist = dist;
      name = n;
    }
  }
  return name;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function extractColors(file: File, colorCount: number = 8): Promise<ExtractedColor[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Sample at reduced size for performance
        const sampleSize = 100;
        const canvas = document.createElement('canvas');
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // K-means clustering for color extraction
        const colors = kMeansClustering(pixels, colorCount);
        
        // Sort by percentage (most dominant first)
        colors.sort((a, b) => b.percentage - a.percentage);
        
        URL.revokeObjectURL(img.src);
        resolve(colors);
      } catch (e) {
        URL.revokeObjectURL(img.src);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

function kMeansClustering(pixels: Uint8ClampedArray, k: number): ExtractedColor[] {
  const pixelCount = pixels.length / 4;
  
  // Collect pixel data, skipping transparent pixels
  const points: [number, number, number][] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] > 128) { // Skip transparent pixels
      points.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  }

  if (points.length === 0) {
    return [{ hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, percentage: 100, name: 'Black' }];
  }

  // Initialize centroids using k-means++ 
  const centroids: [number, number, number][] = [];
  centroids.push(points[Math.floor(Math.random() * points.length)]);
  
  for (let c = 1; c < k; c++) {
    const distances = points.map(p => {
      const minDist = Math.min(...centroids.map(cent => 
        (p[0] - cent[0]) ** 2 + (p[1] - cent[1]) ** 2 + (p[2] - cent[2]) ** 2
      ));
      return minDist;
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalDist;
    for (let i = 0; i < distances.length; i++) {
      random -= distances[i];
      if (random <= 0) {
        centroids.push(points[i]);
        break;
      }
    }
    if (centroids.length <= c) {
      centroids.push(points[Math.floor(Math.random() * points.length)]);
    }
  }

  // Run k-means iterations
  const maxIterations = 20;
  const assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assign points to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let closest = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dist = (points[i][0] - centroids[c][0]) ** 2 +
                     (points[i][1] - centroids[c][1]) ** 2 +
                     (points[i][2] - centroids[c][2]) ** 2;
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      }
      if (assignments[i] !== closest) {
        assignments[i] = closest;
        changed = true;
      }
    }

    if (!changed) break;

    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let i = 0; i < points.length; i++) {
        if (assignments[i] === c) {
          sumR += points[i][0];
          sumG += points[i][1];
          sumB += points[i][2];
          count++;
        }
      }
      if (count > 0) {
        centroids[c] = [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)];
      }
    }
  }

  // Calculate cluster sizes
  const clusterSizes = new Array(k).fill(0);
  for (const a of assignments) {
    clusterSizes[a]++;
  }

  return centroids.map((c, i) => ({
    hex: rgbToHex(c[0], c[1], c[2]),
    rgb: { r: c[0], g: c[1], b: c[2] },
    percentage: Math.round((clusterSizes[i] / points.length) * 100),
    name: getColorName(c[0], c[1], c[2]),
  })).filter(c => c.percentage > 0);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
