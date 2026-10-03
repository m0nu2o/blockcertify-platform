"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Image as ImageIcon, UploadCloud, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function QRScanner({ onScan }: { onScan: (value: string) => void }) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('upload');
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera scanner when on camera tab
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let scanner: Html5QrcodeScanner | null = null;
    try {
      scanner = new Html5QrcodeScanner(
        'qr-scanner-box',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner?.clear().catch(() => undefined);
        },
        (error) => {
          // ignore background frame errors
        }
      );
    } catch (err) {
      console.warn('QR Camera init error:', err);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => undefined);
      }
    };
  }, [activeTab, onScan]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const toastId = toast.loading('Scanning QR from uploaded image...');

    try {
      // Use temporary html5qrcode reader
      const html5QrCode = new Html5Qrcode('qr-hidden-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      toast.success('QR Code detected!', { id: toastId });
      onScan(decodedText);
    } catch (err) {
      console.error(err);
      toast.error('Could not find a valid QR code in this image. Please ensure the QR is clear.', { id: toastId });
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Switch between Upload Image & Camera */}
      <div className="flex p-1 bg-foreground/[0.04] border border-border/15 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'upload'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          <ImageIcon className="size-3.5" /> Upload QR Image
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'camera'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          <Camera className="size-3.5" /> Use Live Camera
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-border/30 hover:border-accent/60 bg-foreground/[0.02] hover:bg-accent/[0.04] rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="size-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              {scanning ? (
                <RefreshCw className="size-7 text-accent animate-spin" />
              ) : (
                <UploadCloud className="size-7 text-accent" />
              )}
            </div>
            <div className="text-sm font-bold text-foreground">
              {scanning ? 'Decoding QR Code...' : 'Click or Drop Certificate / QR Image'}
            </div>
            <p className="text-xs text-foreground/50 mt-1 max-w-xs">
              Supports PNG, JPG, WEBP, or screenshots containing a BlockCertify QR code.
            </p>
            <span className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
              Browse Image
            </span>
          </div>
          {/* Hidden element for file scanning engine */}
          <div id="qr-hidden-reader" className="hidden" />
        </div>
      ) : (
        <div className="space-y-3">
          <div id="qr-scanner-box" className="overflow-hidden rounded-2xl border border-border/20 bg-black min-h-[280px]" />
          <p className="text-[11px] text-foreground/50 text-center">
            Position the certificate QR code steadily inside the camera viewport.
          </p>
        </div>
      )}
    </div>
  );
}
