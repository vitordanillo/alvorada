import type { Product, Supplier } from '@/lib/types';

// Omit 'id' for seeding data
type SeedSupplier = Omit<Supplier, 'id'>;
type SeedProduct = Omit<Product, 'id' | 'status' | 'sku'>;

export const mockSuppliersData: SeedSupplier[] = [
  { name: 'Atacado Ponto Certo', contactName: 'Mariana Lima', phone: '(11) 98765-1111', email: 'contato@pontocerto.com' },
  { name: 'Distribuidora Fartura', contactName: 'Carlos Souza', phone: '(21) 98765-2222', email: 'vendas@fartura.com' },
  { name: 'Hortifruti Frescor da Terra', contactName: 'Ana Paula', phone: '(31) 98765-3333', email: 'frescor@terra.com' },
];

const supplierNames = mockSuppliersData.map(s => s.name);

const createInitialHistory = (stock: number, cost: number) => {
  return [{ date: new Date().toISOString(), quantity: stock, cost: cost }];
};

// Extremely lightweight baseline data (rest is seeded via npx prisma db seed)
export const mockProductsData: SeedProduct[] = [
  { name: 'Arroz Agulhinha Tipo 1 5kg', barcode: '7896004000017', category: 'Alimentos', price: 28.50, averageCost: 22.00, costHistory: createInitialHistory(50, 22.00), stock: 50, minStock: 10, unit: 'un', supplier: supplierNames[0] },
  { name: 'Feijão Carioca Tipo 1 1kg', barcode: '7896004000024', category: 'Alimentos', price: 8.99, averageCost: 6.50, costHistory: createInitialHistory(80, 6.50), stock: 80, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Açúcar Refinado Caravelas 1kg', barcode: '7896004000031', category: 'Alimentos', price: 5.49, averageCost: 4.00, costHistory: createInitialHistory(100, 4.00), stock: 100, minStock: 25, unit: 'un', supplier: supplierNames[0] },
  { name: 'Café em Pó Tradicional 500g', barcode: '7896004000048', category: 'Alimentos', price: 16.90, averageCost: 13.00, costHistory: createInitialHistory(60, 13.00), stock: 60, minStock: 15, unit: 'un', supplier: supplierNames[1] },
  { name: 'Óleo de Soja Liza 900ml', barcode: '7896004000055', category: 'Alimentos', price: 6.89, averageCost: 5.20, costHistory: createInitialHistory(70, 5.20), stock: 70, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Leite Integral UHT Elegê 1L', barcode: '7896004000062', category: 'Alimentos', price: 5.29, averageCost: 4.10, costHistory: createInitialHistory(120, 4.10), stock: 120, minStock: 30, unit: 'un', supplier: supplierNames[1] },
  { name: 'Pão de Forma Tradicional 500g', barcode: '7896004000079', category: 'Alimentos', price: 7.99, averageCost: 5.50, costHistory: createInitialHistory(30, 5.50), stock: 30, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Macarrão Espaguete Adria 500g', barcode: '7896004000086', category: 'Alimentos', price: 4.29, averageCost: 3.00, costHistory: createInitialHistory(90, 3.00), stock: 90, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Molho de Tomate Tradicional 340g', barcode: '7896004000093', category: 'Alimentos', price: 2.99, averageCost: 2.00, costHistory: createInitialHistory(80, 2.00), stock: 80, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Sal Refinado Cisne 1kg', barcode: '7896004000109', category: 'Alimentos', price: 2.49, averageCost: 1.50, costHistory: createInitialHistory(50, 1.50), stock: 50, minStock: 10, unit: 'un', supplier: supplierNames[0] },
];
