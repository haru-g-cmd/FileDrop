import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Link, Type, Wifi, Mail } from 'lucide-react';
import ToolLayout from '../shared/ToolLayout';
import { downloadBlob } from '../../utils/fileUtils';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import type { QROptions } from '../../types';

type PresetType = 'url' | 'text' | 'wifi' | 'email';

interface WifiFields {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
}

const PRESETS: { type: PresetType; label: string; icon: React.ReactNode }[] = [
  { type: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'wifi', label: 'Wi-Fi', icon: <Wifi className="w-4 h-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
];

const ERROR_LEVELS: { value: QROptions['errorCorrection']; label: string }[] = [
  { value: 'L', label: 'Low (7%)' },
  { value: 'M', label: 'Medium (15%)' },
  { value: 'Q', label: 'Quartile (25%)' },
  { value: 'H', label: 'High (30%)' },
];

export default function QRGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [preset, setPreset] = useState<PresetType>('url');
  const [textInput, setTextInput] = useState('');
  const [wifiFields, setWifiFields] = useState<WifiFields>({
    ssid: '',
    password: '',
    encryption: 'WPA',
  });
  const [emailInput, setEmailInput] = useState('');
  const [size, setSize] = useState(400);
  const [errorCorrection, setErrorCorrection] = useState<QROptions['errorCorrection']>('M');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');

  const getQRText = useCallback((): string => {
    switch (preset) {
      case 'url':
      case 'text':
        return textInput;
      case 'wifi':
        return `WIFI:T:${wifiFields.encryption};S:${wifiFields.ssid};P:${wifiFields.password};;`;
      case 'email':
        return `mailto:${emailInput}`;
      default:
        return textInput;
    }
  }, [preset, textInput, wifiFields, emailInput]);

  const hasContent = useCallback((): boolean => {
    switch (preset) {
      case 'url':
      case 'text':
        return textInput.trim().length > 0;
      case 'wifi':
        return wifiFields.ssid.trim().length > 0;
      case 'email':
        return emailInput.trim().length > 0;
      default:
        return false;
    }
  }, [preset, textInput, wifiFields.ssid, emailInput]);

  // Generate QR code on canvas whenever inputs change
  useEffect(() => {
    if (!canvasRef.current || !hasContent()) {
      // Clear canvas when no content
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = size;
          canvasRef.current.height = size;
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, size, size);
        }
      }
      return;
    }

    const text = getQRText();

    QRCode.toCanvas(canvasRef.current, text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: errorCorrection,
      color: {
        dark: foreground,
        light: background,
      },
    }).catch(() => {
      // Silently handle errors for invalid input during typing
    });
  }, [textInput, wifiFields, emailInput, preset, size, errorCorrection, foreground, background, getQRText, hasContent]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !hasContent()) {
      toast.error('Nothing to download. Enter some content first.');
      return;
    }

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'qrcode.png');
        toast.success('QR code downloaded!');
      }
    }, 'image/png');
  }, [hasContent]);

  const handlePresetChange = useCallback((newPreset: PresetType) => {
    setPreset(newPreset);
    // Clear all inputs when switching presets
    setTextInput('');
    setEmailInput('');
    setWifiFields({ ssid: '', password: '', encryption: 'WPA' });
  }, []);

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Generate QR codes for URLs, text, Wi-Fi credentials, and email addresses."
    >
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-5">
          {/* Preset selector */}
          <div className="card p-5">
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.type}
                  onClick={() => handlePresetChange(p.type)}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150"
                  style={{
                    backgroundColor:
                      preset === p.type
                        ? 'var(--color-accent-muted)'
                        : 'var(--color-bg-tertiary)',
                    color:
                      preset === p.type
                        ? 'var(--color-accent)'
                        : 'var(--color-text-secondary)',
                    borderWidth: '1px',
                    borderColor:
                      preset === p.type
                        ? 'var(--color-accent)'
                        : 'transparent',
                  }}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content input */}
          <div className="card p-5">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Content
            </label>

            {(preset === 'url' || preset === 'text') && (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={preset === 'url' ? 'https://example.com' : 'Enter text content...'}
                className="input-field resize-none"
                rows={3}
              />
            )}

            {preset === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiFields.ssid}
                    onChange={(e) =>
                      setWifiFields((prev) => ({ ...prev, ssid: e.target.value }))
                    }
                    placeholder="MyNetwork"
                    className="input-field"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Password
                  </label>
                  <input
                    type="text"
                    value={wifiFields.password}
                    onChange={(e) =>
                      setWifiFields((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Password"
                    className="input-field"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Encryption
                  </label>
                  <select
                    value={wifiFields.encryption}
                    onChange={(e) =>
                      setWifiFields((prev) => ({
                        ...prev,
                        encryption: e.target.value as WifiFields['encryption'],
                      }))
                    }
                    className="input-field"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </div>
              </div>
            )}

            {preset === 'email' && (
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="user@example.com"
                className="input-field"
              />
            )}
          </div>

          {/* Options */}
          <div className="card p-5 space-y-4">
            <label
              className="block text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Options
            </label>

            {/* Size slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Size
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {size}px
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={1000}
                step={50}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              />
              <div
                className="flex justify-between mt-1 text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <span>200px</span>
                <span>1000px</span>
              </div>
            </div>

            {/* Error correction */}
            <div>
              <span
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Error Correction
              </span>
              <select
                value={errorCorrection}
                onChange={(e) =>
                  setErrorCorrection(e.target.value as QROptions['errorCorrection'])
                }
                className="input-field"
              >
                {ERROR_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Foreground
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  <input
                    type="text"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    className="input-field flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <span
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Background
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="input-field flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview + Download */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Preview
              </span>
              {hasContent() && (
                <button onClick={handleDownload} className="btn-primary text-sm">
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              )}
            </div>
            <div
              className="flex items-center justify-center rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <canvas
                ref={canvasRef}
                className="rounded"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  imageRendering: 'pixelated',
                }}
              />
            </div>
            {!hasContent() && (
              <p
                className="text-center text-xs mt-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Enter content on the left to see a live preview
              </p>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
