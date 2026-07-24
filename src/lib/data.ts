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
  // --- ALIMENTOS ---
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
  { name: 'Biscoito Cream Cracker Vitarella 200g', barcode: '7896004000116', category: 'Alimentos', price: 3.99, averageCost: 2.80, costHistory: createInitialHistory(60, 2.80), stock: 60, minStock: 15, unit: 'un', supplier: supplierNames[1] },
  { name: 'Farinha de Trigo Sol 1kg', barcode: '7896004000123', category: 'Alimentos', price: 5.89, averageCost: 4.20, costHistory: createInitialHistory(50, 4.20), stock: 50, minStock: 15, unit: 'un', supplier: supplierNames[0] },
  { name: 'Achocolatado em Pó Nescau 400g', barcode: '7896004000314', category: 'Alimentos', price: 8.49, averageCost: 6.00, costHistory: createInitialHistory(45, 6.00), stock: 45, minStock: 10, unit: 'un', supplier: supplierNames[0] },
  { name: 'Creme de Leite Nestlé 200g', barcode: '7896004000321', category: 'Alimentos', price: 3.89, averageCost: 2.70, costHistory: createInitialHistory(75, 2.70), stock: 75, minStock: 15, unit: 'un', supplier: supplierNames[1] },
  { name: 'Leite Condensado Moça 395g', barcode: '7896004000338', category: 'Alimentos', price: 6.29, averageCost: 4.80, costHistory: createInitialHistory(50, 4.80), stock: 50, minStock: 12, unit: 'un', supplier: supplierNames[1] },
  { name: 'Farofa Pronta de Mandioca Yoki 400g', barcode: '7896004000345', category: 'Alimentos', price: 5.90, averageCost: 4.20, costHistory: createInitialHistory(40, 4.20), stock: 40, minStock: 8, unit: 'un', supplier: supplierNames[0] },
  { name: 'Maionese Hellmanns Tradicional 500g', barcode: '7896004000352', category: 'Alimentos', price: 7.99, averageCost: 5.80, costHistory: createInitialHistory(30, 5.80), stock: 30, minStock: 6, unit: 'un', supplier: supplierNames[1] },
  { name: 'Milho Verde Bonduelle 170g', barcode: '7896004000369', category: 'Alimentos', price: 3.49, averageCost: 2.30, costHistory: createInitialHistory(60, 2.30), stock: 60, minStock: 12, unit: 'un', supplier: supplierNames[0] },
  { name: 'Tempero Alho e Sal Arisco 300g', barcode: '7896004000376', category: 'Alimentos', price: 4.90, averageCost: 3.50, costHistory: createInitialHistory(35, 3.50), stock: 35, minStock: 10, unit: 'un', supplier: supplierNames[0] },

  // --- BEBIDAS ---
  { name: 'Refrigerante Coca-Cola 2L', barcode: '7896004000130', category: 'Bebidas', price: 9.99, averageCost: 7.50, costHistory: createInitialHistory(40, 7.50), stock: 40, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Água Mineral sem Gás Crystal 1.5L', barcode: '7896004000147', category: 'Bebidas', price: 3.29, averageCost: 1.80, costHistory: createInitialHistory(100, 1.80), stock: 100, minStock: 24, unit: 'un', supplier: supplierNames[1] },
  { name: 'Cerveja Skol Pilsen Lata 350ml', barcode: '7896004000154', category: 'Bebidas', price: 3.49, averageCost: 2.60, costHistory: createInitialHistory(150, 2.60), stock: 150, minStock: 48, unit: 'un', supplier: supplierNames[1] },
  { name: 'Cerveja Heineken Lata 350ml', barcode: '7896004000383', category: 'Bebidas', price: 5.49, averageCost: 4.20, costHistory: createInitialHistory(120, 4.20), stock: 120, minStock: 24, unit: 'un', supplier: supplierNames[1] },
  { name: 'Suco de Uva Integral Aurora 1.5L', barcode: '7896004000390', category: 'Bebidas', price: 16.90, averageCost: 12.00, costHistory: createInitialHistory(30, 12.00), stock: 30, minStock: 6, unit: 'un', supplier: supplierNames[2] },
  { name: 'Suco de Laranja Integral Pratss 1L', barcode: '7896004000161', category: 'Bebidas', price: 12.50, averageCost: 9.50, costHistory: createInitialHistory(25, 9.50), stock: 25, minStock: 5, unit: 'un', supplier: supplierNames[2] },

  // --- LIMPEZA ---
  { name: 'Sabão em Pó Omo Sanitizante 1kg', barcode: '7896004000178', category: 'Limpeza', price: 19.90, averageCost: 15.00, costHistory: createInitialHistory(30, 15.00), stock: 30, minStock: 8, unit: 'un', supplier: supplierNames[0] },
  { name: 'Detergente Líquido Neutro Ipê 500ml', barcode: '7896004000185', category: 'Limpeza', price: 2.69, averageCost: 1.80, costHistory: createInitialHistory(80, 1.80), stock: 80, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Desinfetante Pinho Sol Menta 500ml', barcode: '7896004000192', category: 'Limpeza', price: 7.49, averageCost: 5.20, costHistory: createInitialHistory(40, 5.20), stock: 40, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Água Sanitária Ypê 1L', barcode: '7896004000208', category: 'Limpeza', price: 4.29, averageCost: 3.00, costHistory: createInitialHistory(50, 3.00), stock: 50, minStock: 15, unit: 'un', supplier: supplierNames[1] },
  { name: 'Esponja de Aço Assolan c/8', barcode: '7896004000215', category: 'Limpeza', price: 2.49, averageCost: 1.50, costHistory: createInitialHistory(60, 1.50), stock: 60, minStock: 20, unit: 'un', supplier: supplierNames[0] },
  { name: 'Amaciante Concentrado Downy 1L', barcode: '7896004000406', category: 'Limpeza', price: 17.90, averageCost: 13.00, costHistory: createInitialHistory(25, 13.00), stock: 25, minStock: 5, unit: 'un', supplier: supplierNames[0] },

  // --- HIGIENE ---
  { name: 'Sabonete em Barra Dove 90g', barcode: '7896004000222', category: 'Higiene', price: 3.49, averageCost: 2.20, costHistory: createInitialHistory(100, 2.20), stock: 100, minStock: 30, unit: 'un', supplier: supplierNames[0] },
  { name: 'Creme Dental Colgate Tripla Ação 90g', barcode: '7896004000239', category: 'Higiene', price: 4.99, averageCost: 3.20, costHistory: createInitialHistory(70, 3.20), stock: 70, minStock: 20, unit: 'un', supplier: supplierNames[1] },
  { name: 'Papel Higiênico Neve F. Dupla 4 unidades', barcode: '7896004000246', category: 'Higiene', price: 8.99, averageCost: 6.50, costHistory: createInitialHistory(50, 6.50), stock: 50, minStock: 12, unit: 'un', supplier: supplierNames[0] },
  { name: 'Shampoo Pantene Hidratação 350ml', barcode: '7896004000253', category: 'Higiene', price: 16.90, averageCost: 12.50, costHistory: createInitialHistory(30, 12.50), stock: 30, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Condicionador Pantene Hidratação 350ml', barcode: '7896004000413', category: 'Higiene', price: 18.90, averageCost: 14.00, costHistory: createInitialHistory(30, 14.00), stock: 30, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Desodorante Rexona Aerosol 150ml', barcode: '7896004000420', category: 'Higiene', price: 15.90, averageCost: 11.50, costHistory: createInitialHistory(50, 11.50), stock: 50, minStock: 10, unit: 'un', supplier: supplierNames[1] },
  { name: 'Fio Dental Colgate 50m', barcode: '7896004000437', category: 'Higiene', price: 7.49, averageCost: 4.50, costHistory: createInitialHistory(40, 4.50), stock: 40, minStock: 8, unit: 'un', supplier: supplierNames[0] },

  // --- OUTROS (Carnes, Frios, Hortifruti) ---
  { name: 'Banana Prata', barcode: '7896004000260', category: 'Outros', price: 6.99, averageCost: 4.50, costHistory: createInitialHistory(20, 4.50), stock: 20, minStock: 5, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Tomate Italiano', barcode: '7896004000277', category: 'Outros', price: 8.99, averageCost: 6.00, costHistory: createInitialHistory(15, 6.00), stock: 15, minStock: 5, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Batata Inglesa', barcode: '7896004000284', category: 'Outros', price: 5.99, averageCost: 4.00, costHistory: createInitialHistory(30, 4.00), stock: 30, minStock: 10, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Pão Francês Unitário', barcode: '7896004000291', category: 'Outros', price: 0.75, averageCost: 0.40, costHistory: createInitialHistory(100, 0.40), stock: 100, minStock: 20, unit: 'un', supplier: supplierNames[1] },
  { name: 'Queijo Mussarela Fatiado 200g', barcode: '7896004000307', category: 'Outros', price: 13.90, averageCost: 10.50, costHistory: createInitialHistory(20, 10.50), stock: 20, minStock: 5, unit: 'un', supplier: supplierNames[1] },
  { name: 'Cebola Nacional', barcode: '7896004000444', category: 'Outros', price: 5.49, averageCost: 3.50, costHistory: createInitialHistory(25, 3.50), stock: 25, minStock: 5, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Alho Cabeça 100g', barcode: '7896004000451', category: 'Outros', price: 3.99, averageCost: 2.50, costHistory: createInitialHistory(15, 2.50), stock: 15, minStock: 3, unit: 'un', supplier: supplierNames[2] },
  { name: 'Maçã Gala', barcode: '7896004000468', category: 'Outros', price: 9.99, averageCost: 6.80, costHistory: createInitialHistory(20, 6.80), stock: 20, minStock: 5, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Limão Taiti', barcode: '7896004000475', category: 'Outros', price: 4.99, averageCost: 3.00, costHistory: createInitialHistory(30, 3.00), stock: 30, minStock: 5, unit: 'kg', supplier: supplierNames[2] },
  { name: 'Presunto Cozido Sadia Fatiado 200g', barcode: '7896004000482', category: 'Outros', price: 7.99, averageCost: 5.80, costHistory: createInitialHistory(25, 5.80), stock: 25, minStock: 5, unit: 'un', supplier: supplierNames[1] },
  { name: 'Peito de Frango Seara Resfriado 1kg', barcode: '7896004000499', category: 'Outros', price: 19.90, averageCost: 14.00, costHistory: createInitialHistory(20, 14.00), stock: 20, minStock: 4, unit: 'un', supplier: supplierNames[0] },
  { name: 'Carne Moída Patinho 1kg', barcode: '7896004000505', category: 'Outros', price: 38.90, averageCost: 29.00, costHistory: createInitialHistory(15, 29.00), stock: 15, minStock: 3, unit: 'un', supplier: supplierNames[0] },
  { name: 'Manteiga com Sal Elegê 200g', barcode: '7896004000512', category: 'Outros', price: 10.99, averageCost: 8.20, costHistory: createInitialHistory(30, 8.20), stock: 30, minStock: 5, unit: 'un', supplier: supplierNames[1] },
  { name: 'Iogurte Grego Vigor Morango 100g', barcode: '7896004000529', category: 'Outros', price: 3.49, averageCost: 2.20, costHistory: createInitialHistory(50, 2.20), stock: 50, minStock: 10, unit: 'un', supplier: supplierNames[1] },
];
