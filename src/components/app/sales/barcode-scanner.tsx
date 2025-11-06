
'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          codeReaderRef.current.decodeFromStream(stream, videoRef.current, (result, error) => {
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
        setIsScanning(false);
        // Correctly stop the scanner and release the camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        // The `reset` method on BrowserMultiFormatReader is not for stopping the stream in this context.
        // Stopping the tracks of the MediaStream is the correct way to release the camera.
    };
  }, [onScan, isScanning]);

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
