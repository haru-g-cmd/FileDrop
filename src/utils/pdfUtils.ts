import { PDFDocument } from 'pdf-lib';

export async function mergePdfs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  return new Blob([mergedBytes], { type: 'application/pdf' });
}

export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
}

export async function getPdfThumbnail(file: File, pageIndex: number = 0): Promise<string> {
  // Create a thumbnail using canvas (basic approach - renders first page info)
  // Since pdf-lib doesn't render, we return a placeholder with page info
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const page = pdf.getPage(pageIndex);
  const { width, height } = page.getSize();
  
  const canvas = document.createElement('canvas');
  const scale = 150 / Math.max(width, height);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  
  // Draw a styled placeholder
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  
  // Draw page lines to simulate content
  ctx.fillStyle = '#d1d5db';
  const lineHeight = 6;
  const padding = canvas.width * 0.15;
  for (let y = padding; y < canvas.height - padding; y += lineHeight * 2) {
    const lineWidth = padding + Math.random() * (canvas.width - padding * 3);
    ctx.fillRect(padding, y, lineWidth, lineHeight * 0.6);
  }
  
  // Draw page number
  ctx.fillStyle = '#6b7280';
  ctx.font = `bold ${Math.max(10, canvas.width * 0.12)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`${pageIndex + 1}`, canvas.width / 2, canvas.height / 2);
  
  return canvas.toDataURL('image/png');
}
