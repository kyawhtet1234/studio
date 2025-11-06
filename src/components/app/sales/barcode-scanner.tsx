
'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const { toast } = useToast();
  const codeReader = new BrowserMultiFormatReader();

  useEffect(() => {
    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          codeReader.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result && isScanning) {
              setIsScanning(false);
              onScan(result.getText());
            }
            if (error && !(error instanceof NotFoundException) && isScanning) {
              console.error('Barcode scan error:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    startScanner();

    return () => {
      codeReader.reset();
      setIsScanning(false);
    };
  }, [onScan]);

  return (
    <div>
        <video ref={videoRef} className="w-full aspect-video rounded-md" />
        {hasCameraPermission === false && (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Camera permission is required to scan barcodes. Please enable it in your browser settings.
                </AlertDescription>
            </Alert>
        )}
    </div>
  );
}
