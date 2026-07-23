
'use client';

import * as React from 'react';
import { Html5QrcodeScanner, type Html5QrcodeResult } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CameraOff } from 'lucide-react';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

const scannerRegionId = "barcode-scanner-region";

export function BarcodeScannerDialog({ open, onOpenChange, onScanSuccess }: BarcodeScannerDialogProps) {
  const [permissionError, setPermissionError] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    // This variable holds the scanner instance for the current render of the effect.
    let html5QrcodeScanner: Html5QrcodeScanner | null = null;

    const onScanSuccessCallback = (decodedText: string, result: Html5QrcodeResult) => {
      // It's crucial to stop scanning before calling the parent's success handler,
      // which will close the dialog and unmount this component.
      if (html5QrcodeScanner) {
        // Stop the scanner and wait for the promise to resolve.
        html5QrcodeScanner.clear()
          .then(() => {
            onScanSuccess(decodedText);
          })
          .catch(err => {
            console.error("Error clearing scanner after success:", err);
            // Proceed with the success handler even if cleanup fails to avoid getting stuck.
            onScanSuccess(decodedText);
          });
        // Nullify the instance to prevent further operations.
        html5QrcodeScanner = null;
      }
    };

    const onScanFailureCallback = (error: string) => {
      // This is called for non-fatal errors, like no barcode being in the frame. We can ignore it.
    };
    
    // Ensure the target DOM element exists before trying to initialize the scanner.
    // This check is crucial to prevent client-side exceptions on initial load.
    const scannerContainer = document.getElementById(scannerRegionId);
    if (scannerContainer) {
        try {
            setPermissionError(false);
            html5QrcodeScanner = new Html5QrcodeScanner(
                scannerRegionId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    rememberLastUsedCamera: true,
                    videoConstraints: {
                        facingMode: { ideal: "environment" }
                    }
                },
                /* verbose= */ false
            );
            html5QrcodeScanner.render(onScanSuccessCallback, onScanFailureCallback);
        } catch (err) {
            console.error("Error initializing or rendering scanner:", err);
            setPermissionError(true);
        }
    } else {
         console.error(`DOM element with ID '${scannerRegionId}' not found during component mount.`);
    }

    // This is the cleanup function for the effect. It runs when `open` becomes false.
    return () => {
      if (html5QrcodeScanner) {
         html5QrcodeScanner.clear().catch(err => {
            console.error("Failed to clear scanner on unmount:", err);
         });
      }
    };
  }, [open, onScanSuccess]); // Re-run effect if the dialog is opened/closed.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código de Barras</DialogTitle>
          <DialogDescription>
            Aponte a câmera para o código de barras do produto.
          </DialogDescription>
        </DialogHeader>
        
        <div id={scannerRegionId} className="w-full" />
        
        {permissionError && (
          <Alert variant="destructive" className="mt-4">
            <CameraOff className="h-4 w-4" />
            <AlertTitle>Câmera não acessível</AlertTitle>
            <AlertDescription>
              Verifique se você concedeu as permissões de câmera para este site no seu navegador.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
