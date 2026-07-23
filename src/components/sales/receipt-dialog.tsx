
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Receipt } from './receipt';
import type { Sale } from '@/lib/types';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReceiptDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDialog({ sale, open, onOpenChange }: ReceiptDialogProps) {
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=400');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Recibo</title>');
        printWindow.document.write(`
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 10pt;
              width: 280px;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .w-12 { width: 3rem; }
            .h-12 { height: 3rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .mb-2 { margin-bottom: .5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mt-4 { margin-top: 1rem; }
            .text-xs { font-size: .75rem; }
            .text-lg { font-size: 1.125rem; }
            .border-t { border-top: 1px dashed #000; }
            .py-1 { padding: 4px 0; }
            .py-2 { padding: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .align-top { vertical-align: top; }
            .text-muted-foreground { color: #666; }
            .text-primary { color: #74A9EA; } /* Using primary color from theme */
            svg { display: inline-block; }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.body.innerHTML = printContent.innerHTML;
        
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 250);
      }
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Recibo da Venda</DialogTitle>
             <DialogDescription>
              Venda de {format(new Date(sale.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div ref={receiptRef}>
             <Receipt sale={sale} />
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t bg-muted/50">
          <Button onClick={handlePrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
