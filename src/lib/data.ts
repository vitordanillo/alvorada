
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
  if (stock > 0 && cost > 0) {
    return [{ date: new Date().toISOString(), quantity: stock, cost: cost }];
  }
  return [];
};

export const mockProductsData: SeedProduct[] = [
  // Alimentos
  { name: 'Arroz Agulhinha Tipo 1 5kg', barcode: '7896004000017', category: 'Alimentos', price: 28.50, averageCost: 22.00, costHistory: createInitialHistory(50, 22.00), stock: 50, minStock: 10, unit: 'un', supplier: supplierNames[0] },
  { name: 'Feijão Carioca 1kg', barcode: '7896004000024', category: 'Alimentos', price: 8.99, averageCost: 6.50, costHistory: createInitialHistory(80, 6.50), stock: 80, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Açúcar Refinado 1kg', barcode: '7896004000031', category: 'Alimentos', price: 5.49, averageCost: 4.00, costHistory: createInitialHistory(100, 4.00), stock: 100, minStock: 25, unit: 'un', supplier: supplierNames[0] },
  { name: 'Café em Pó 500g', barcode: '7896004000048', category: 'Alimentos', price: 15.90, averageCost: 12.50, costHistory: createInitialHistory(60, 12.50), stock: 60, minStock: 15, unit: 'un', supplier: supplierNames[1] },
  { name: 'Óleo de Soja 900ml', barcode: '7896004000055', category: 'Alimentos', price: 7.89, averageCost: 6.20, costHistory: createInitialHistory(70, 6.20), stock: 70, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Leite Integral UHT 1L', barcode: '7896004000062', category: 'Alimentos', price: 4.99, averageCost: 4.10, costHistory: createInitialHistory(120, 4.10), stock: 120, minStock: 30, unit: 'un', supplier: supplierNames[1] },
  { name: 'Pão de Forma Tradicional 500g', barcode: '7896004000079', category: 'Alimentos', price: 8.50, averageCost: 6.00, costHistory: createInitialHistory(30, 6.00), stock: 30, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Macarrão Espaguete 500g', barcode: '7896004000086', category: 'Alimentos', price: 4.50, averageCost: 3.20, costHistory: createInitialHistory(90, 3.20), stock: 90, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Molho de Tomate Tradicional 340g', barcode: '7896004000093', category: 'Alimentos', price: 3.29, averageCost: 2.50, costHistory: createInitialHistory(80, 2.50), stock: 80, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Sal Refinado 1kg', barcode: '7896004000109', category: 'Alimentos', price: 2.99, averageCost: 1.80, costHistory: createInitialHistory(50, 1.80), stock: 50, minStock: 10, unit: 'un', supplier: supplierNames[0] },
  { name: 'Biscoito Cream Cracker 200g', barcode: '7896004000116', category: 'Alimentos', price: 4.20, averageCost: 3.10, costHistory: createInitialHistory(60, 3.10), stock: 60, minStock: 15, unit: 'un', supplier: supplierNames[1] },
  { name: 'Farinha de Trigo 1kg', barcode: '7896004000123', category: 'Alimentos', price: 6.20, averageCost: 4.80, costHistory: createInitialHistory(50, 4.80), stock: 50, minStock: 15, unit: 'un', supplier: supplierNames[0] },
  // Bebidas
  { name: 'Refrigerante Cola 2L', barcode: '7896004000130', category: 'Bebidas', price: 9.50, averageCost: 7.00, costHistory: createInitialHistory(40, 7.00), stock: 40, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Água Mineral sem Gás 1.5L', barcode: '7896004000147', category: 'Bebidas', price: 3.00, averageCost: 2.00, costHistory: createInitialHistory(100, 2.00), stock: 100, minStock: 24, unit: 'un', supplier: supplierNames[1] },
  { name: 'Cerveja Pilsen 350ml Lata', barcode: '7896004000154', category: 'Bebidas', price: 3.50, averageCost: 2.80, costHistory: createInitialHistory(150, 2.80), stock: 150, minStock: 48, unit: 'un', supplier: supplierNames[1] },
  { name: 'Suco de Laranja Integral 1L', barcode: '7896004000161', category: 'Bebidas', price: 12.50, averageCost: 9.80, costHistory: createInitialHistory(25, 9.80), stock: 25, minStock: 5, unit: 'un', supplier: supplierNames[2] },
  // Limpeza
  { name: 'Sabão em Pó 1kg', barcode: '7896004000178', category: 'Limpeza', price: 18.90, averageCost: 14.00, costHistory: createInitialHistory(30, 14.00), stock: 30, minStock: 8, unit: 'un', supplier: supplierNames[0] },
  { name: 'Detergente Líquido Neutro 500ml', barcode: '7896004000185', category: 'Limpeza', price: 2.89, averageCost: 2.10, costHistory: createInitialHistory(80, 2.10), stock: 80, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Desinfetante Pinho 500ml', barcode: '7896004000192', category: 'Limpeza', price: 6.99, averageCost: 5.00, costHistory: createInitialHistory(40, 5.00), stock: 40, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Água Sanitária 1L', barcode: '7896004000208', category: 'Limpeza', price: 4.50, averageCost: 3.50, costHistory: createInitialHistory(50, 3.50), stock: 50, minStock: 15, unit: 'un', supplier: supplierNames[1] },
  { name: 'Esponja de Aço', barcode: '7896004000215', category: 'Limpeza', price: 2.00, averageCost: 1.20, costHistory: createInitialHistory(60, 1.20), stock: 60, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  // Higiene
  { name: 'Sabonete em Barra 90g', barcode: '7896004000222', category: 'Higiene', price: 2.50, averageCost: 1.80, costHistory: createInitialHistory(100, 1.80), stock: 100, minStock: 30, unit: 'un', supplier: supplierNames[0] },
  { name: 'Creme Dental 90g', barcode: '7896004000239', category: 'Higiene', price: 4.80, averageCost: 3.50, costHistory: createInitialHistory(70, 3.50), stock: 70, minStock: 20, unit: 'un', supplier: supplierNames[1] },
  { name: 'Papel Higiênico 4 rolos', barcode: '7896004000246', category: 'Higiene', price: 7.99, averageCost: 6.00, costHistory: createInitialHistory(50, 6.00), stock: 50, minStock: 12, unit: 'un', supplier: supplierNames[0] },
  { name: 'Shampoo 350ml', barcode: '7896004000253', category: 'Higiene', price: 14.90, averageCost: 11.00, costHistory: createInitialHistory(30, 11.00), stock: 30, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  // Outros (Hortifruti & Padaria)
  { name: 'Banana Prata', barcode: '7896004000260', category: 'Outros', price: 6.99, averageCost: 4.50, costHistory: createInitialHistory(20, 4.50), stock: 20, minStock: 5, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Tomate', barcode: '7896004000277', category: 'Outros', price: 8.99, averageCost: 6.00, costHistory: createInitialHistory(15, 6.00), stock: 15, minStock: 5, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Batata Inglesa', barcode: '7896004000284', category: 'Outros', price: 5.99, averageCost: 4.00, costHistory: createInitialHistory(30, 4.00), stock: 30, minStock: 10, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Pão Francês', barcode: '7896004000291', category: 'Outros', price: 0.75, averageCost: 0.40, costHistory: createInitialHistory(100, 0.40), stock: 100, minStock: 20, unit: 'un', supplier: supplierNames[1] },
  { name: 'Queijo Mussarela Fatiado 200g', barcode: '7896004000307', category: 'Outros', price: 12.90, averageCost: 10.00, costHistory: createInitialHistory(20, 10.00), stock: 20, minStock: 5, unit: 'un', supplier: supplierNames[1] },
];
