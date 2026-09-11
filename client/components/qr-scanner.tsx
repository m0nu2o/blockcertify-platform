
"use client";

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

export function QRScanner({ onScan }: { onScan: (value: string) => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-scanner', { fps: 10, qrbox: 250 }, false);
    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      () => undefined
    );
    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [onScan]);

  return <div id="qr-scanner" className="overflow-hidden rounded-[24px]" />;
}
