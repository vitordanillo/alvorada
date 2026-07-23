
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { ProductLabel } from '@/components/products/product-label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

export default function PrintPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, loading } = useAppContext();
  
  const [productsToPrint, setProductsToPrint] = React.useState<any[]>([]);

  React.useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam && products.length > 0) {
      const ids = new Set(idsParam.split(','));
      setProductsToPrint(products.filter(p => ids.has(p.id)));
    }
  }, [searchParams, products]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-background p-4 shadow-md flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">Impressão de Etiquetas</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <style jsx global>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 1cm;
            }
          }
        `}</style>
        {loading.products ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <div className="p-4 bg-white shadow-lg rounded-md grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-0">
                {productsToPrint.map(product => (
                    <ProductLabel key={product.id} product={product} />
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
