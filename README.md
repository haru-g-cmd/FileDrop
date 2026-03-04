# FileDrop

Client-side file processing toolkit built with React and TypeScript. It handles image compression, format conversion, resizing, color extraction, and PDF merging. Everything runs in the browser using the Canvas API so nothing gets uploaded anywhere. Files are dragged onto a drop zone that validates types and sizes, and processed results can be downloaded individually or bundled into a zip with JSZip. Dark and light themes are persisted to localStorage and fall back to the system preference.

The app is built with Vite and each tool is lazy loaded with React.lazy so only the code for the active tool gets downloaded. Styling is all Tailwind CSS with custom glassmorphism utilities and animations. Framer Motion handles page transitions, stagger animations on lists, and hover/tap micro interactions across the UI.

```bash
npm install
npm run dev
```

Opens on `localhost:5173`. Build with `npm run build`.