
'use client';

import * as React from 'react';
import Barcode from 'react-barcode';
import type { Product } from '@/lib/types';

interface ProductLabelProps {
  product: Product;
}

export function ProductLabel({ product }: ProductLabelProps) {
  return (
    <div className="p-2 border border-black border-dashed flex flex-col items-center justify-between text-black break-inside-avoid">
      <div className="text-center w-full">
        <p className="font-sans font-bold text-sm leading-tight truncate">{product.name}</p>
      </div>
      <div className="my-1 w-full flex-grow flex items-center justify-center">
        {product.barcode ? (
          <Barcode 
            value={product.barcode} 
            height={30}
            width={1.2}
            fontSize={10}
            margin={0}
            displayValue={true}
          />
        ) : (
          <div className="h-[50px] flex items-center justify-center text-xs text-slate-500">
            Sem código de barras
          </div>
        )}
      </div>
      <div className="text-center w-full">
        <span className="font-sans font-medium text-xs">R$</span>
        <span className="font-sans font-bold text-3xl leading-none tracking-tighter ml-1">
          {product.price.toFixed(2).replace('.', ',')}
        </span>
      </div>
    </div>
  );
}
