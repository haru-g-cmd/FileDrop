# FileDrop

Client-side file processing toolkit built with React and TypeScript. Everything runs in the browser so nothing gets uploaded anywhere. Files are dragged onto a drop zone that validates types and sizes, and processed results can be downloaded individually or bundled into a zip with JSZip. Dark and light themes are persisted to localStorage and fall back to the system preference.

Image compressor with a live before/after slider and adjustable quality. Format converter that handles image to image (JPEG, PNG, WebP), images to PDF, PDF to images, DOCX to HTML, JSON to CSV, CSV to JSON, and Markdown to HTML. Image resizer, color palette extractor (k-means++ clustering to pull dominant colors with hex/RGB values and CSS gradients), PDF merger (with drag to reorder). QR code generator for URLs, text, Wi-Fi, and email with customizable size, colors, and error correction. Hash generator that computes MD5, SHA-1, SHA-256, and SHA-512 checksums for any file or text. Text diff tool with side by side comparison using LCS.

The app is built with Vite and each tool is lazy loaded with React.lazy so only the code for the active tool gets downloaded. Styling is all Tailwind CSS with custom glassmorphism utilities and animations. Framer Motion handles page transitions, stagger animations on lists, and hover/tap micro interactions across the UI. Image processing uses the Canvas API. PDF operations use pdf-lib and pdfjs-dist. DOCX conversion uses mammoth. Markdown rendering uses marked. QR codes use the qrcode library. Hashing uses the Web Crypto API and SparkMD5.

```bash
npm install
npm run dev
```

Opens on localhost:5173. Build with `npm run build`.
