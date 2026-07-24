'use client';

import * as React from 'react';
import { MoreHorizontal, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold text-sm">{product.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">SKU: {product.sku} {product.barcode ? `| EAN: ${product.barcode}` : ''}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={stockStatus.variant} className={stockStatus.className}>
                  {stockStatus.text}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell font-medium font-mono text-sm">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </TableCell>
              <TableCell className="hidden md:table-cell font-mono text-sm">{product.stock} {product.unit}</TableCell>
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
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Todos');
  const [selectedStatus, setSelectedStatus] = React.useState('Ativos'); // 'Ativos' or 'Inativos'
  const [sortBy, setSortBy] = React.useState('name-asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Filtering
  const filteredByStatus = products.filter(p => selectedStatus === 'Ativos' ? p.status === 'Ativo' : p.status === 'Inativo');
  const filteredByCategory = filteredByStatus.filter(p => selectedCategory === 'Todos' || p.category === selectedCategory);
  
  const filteredBySearch = filteredByCategory.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return p.name.toLowerCase().includes(query) || 
           (p.barcode && p.barcode.includes(query)) || 
           p.sku.includes(query);
  });

  // Sorting
  const sortedProducts = [...filteredBySearch].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'stock-asc') return a.stock - b.stock;
    if (sortBy === 'stock-desc') return b.stock - a.stock;
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="Ativos">Ativos ({products.filter(p => p.status === 'Ativo').length})</TabsTrigger>
              <TabsTrigger value="Inativos">Inativos ({products.filter(p => p.status === 'Inativo').length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary"
              />
            </div>

            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-full">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nome (A - Z)</SelectItem>
                <SelectItem value="name-desc">Nome (Z - A)</SelectItem>
                <SelectItem value="price-asc">Preço (Menor - Maior)</SelectItem>
                <SelectItem value="price-desc">Preço (Maior - Menor)</SelectItem>
                <SelectItem value="stock-asc">Estoque (Menor - Maior)</SelectItem>
                <SelectItem value="stock-desc">Estoque (Maior - Menor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category triggers */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="bg-transparent p-0 flex flex-wrap h-auto gap-2">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border border-muted px-4 py-1.5"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Main List */}
        <div className="rounded-md border">
          <ProductList 
            products={paginatedProducts}
            onEdit={onEdit}
            onSetStatus={onSetStatus}
            selectedProducts={selectedProducts}
            onSelectionChange={onSelectionChange}
          />
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <span className="text-xs text-muted-foreground font-medium">
              Mostrando {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} a {Math.min(totalItems, currentPage * itemsPerPage)} de {totalItems} produtos
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-xs font-semibold px-3 whitespace-nowrap">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
