
'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import Image from 'next/image';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onSetStatus: (product: Product) => void;
  selectedProducts: Set<string>;
  onSelectionChange: (productIds: string[], select: boolean) => void;
}

const ProductList = ({
  products,
  onEdit,
  onSetStatus,
  selectedProducts,
  onSelectionChange
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  onSetStatus: (product: Product) => void;
  selectedProducts: Set<string>;
  onSelectionChange: (productIds: string[], select: boolean) => void;
}) => {
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { text: 'Sem estoque', variant: 'destructive' as const, className: '' };
    if (stock < minStock) return { text: 'Estoque baixo', variant: 'secondary' as const, className: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80' };
    return { text: 'Em estoque', variant: 'secondary' as const, className: 'bg-green-200 text-green-900 hover:bg-green-200/80' };
  };

  const handleSelectAll = (select: boolean) => {
    onSelectionChange(products.map(p => p.id), select);
  };
  
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={products.length > 0 && products.every(p => selectedProducts.has(p.id))}
              onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
              aria-label="Selecionar todos"
            />
          </TableHead>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Image</span>
          </TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Status Estoque</TableHead>
          <TableHead className="hidden md:table-cell">Preço</TableHead>
          <TableHead className="hidden md:table-cell">Estoque</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock, product.minStock);
          return (
            <TableRow key={product.id} data-state={selectedProducts.has(product.id) ? "selected" : ""}>
              <TableCell>
                 <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={(checked) => onSelectionChange([product.id], Boolean(checked))}
                    aria-label="Selecionar linha"
                  />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Image
                  alt={product.name}
                  className="aspect-square rounded-md object-cover"
                  height="64"
                  src={`https://placehold.co/64x64.png`}
                  width="64"
                  data-ai-hint={`${product.category} product`}
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                <Badge variant={stockStatus.variant} className={stockStatus.className}>
                  {stockStatus.text}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </TableCell>
              <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(product)}>Editar</DropdownMenuItem>
                    {product.status === 'Ativo' ? (
                        <DropdownMenuItem onClick={() => onSetStatus(product)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Inativar</DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => onSetStatus(product)}>Ativar</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export function ProductTable({ products, onEdit, onSetStatus, selectedProducts, onSelectionChange }: ProductTableProps) {
  const categories = ['Todos', 'Alimentos', 'Limpeza', 'Higiene', 'Bebidas', 'Outros'];
  
  const activeProducts = products.filter(p => p.status === 'Ativo');
  const inactiveProducts = products.filter(p => p.status === 'Inativo');

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card">
      <CardContent>
        <Tabs defaultValue="Ativos" className="mt-4">
            <TabsList className="mb-4">
                <TabsTrigger value="Ativos">Ativos ({activeProducts.length})</TabsTrigger>
                <TabsTrigger value="Inativos">Inativos ({inactiveProducts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="Ativos">
                 <Tabs defaultValue="Todos">
                    <TabsList className="mb-4 bg-transparent p-0">
                        {categories.map((category) => (
                        <TabsTrigger
                            key={category}
                            value={category}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
                        >
                            {category}
                        </TabsTrigger>
                        ))}
                    </TabsList>
                    {categories.map((category) => (
                        <TabsContent key={category} value={category}>
                            <ProductList 
                                products={activeProducts.filter((p) => category === 'Todos' || p.category === category)}
                                onEdit={onEdit}
                                onSetStatus={onSetStatus}
                                selectedProducts={selectedProducts}
                                onSelectionChange={onSelectionChange}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </TabsContent>
            <TabsContent value="Inativos">
                <ProductList
                    products={inactiveProducts}
                    onEdit={onEdit}
                    onSetStatus={onSetStatus}
                    selectedProducts={selectedProducts}
                    onSelectionChange={onSelectionChange}
                />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
