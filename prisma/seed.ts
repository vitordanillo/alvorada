import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const mockSuppliersData = [
  { name: 'Atacado Ponto Certo', contactName: 'Mariana Lima', phone: '(11) 98765-1111', email: 'contato@pontocerto.com' },
  { name: 'Distribuidora Fartura', contactName: 'Carlos Souza', phone: '(21) 98765-2222', email: 'vendas@fartura.com' },
  { name: 'Hortifruti Frescor da Terra', contactName: 'Ana Paula', phone: '(31) 98765-3333', email: 'frescor@terra.com' },
];

const supplierNames = mockSuppliersData.map(s => s.name);

const createInitialHistory = (stock: number, cost: number) => {
  return [{ date: new Date().toISOString(), quantity: stock, cost: cost }];
};

function generateProducts() {
  const products: any[] = [];
  let barcodeCounter = 7896004000000;

  const nextBarcode = () => {
    barcodeCounter++;
    return String(barcodeCounter);
  };

  // --- 1. ALIMENTOS ---
  const riceBrands = ['Camil', 'Tio João', 'Namorado', 'Prato Fino', 'Namorado'];
  const riceTypes = [
    { type: 'Tipo 1 5kg', price: 28.50, cost: 22.00, stock: 50 },
    { type: 'Tipo 1 1kg', price: 6.89, cost: 5.10, stock: 40 },
    { type: 'Integral 1kg', price: 7.99, cost: 6.00, stock: 30 },
    { type: 'Parboilizado 1kg', price: 7.29, cost: 5.50, stock: 35 }
  ];
  for (const b of riceBrands) {
    for (const t of riceTypes) {
      products.push({
        name: `Arroz ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 10,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const beanBrands = ['Camil', 'Kicaldo', 'Namorado', 'Pantera'];
  const beanTypes = [
    { type: 'Carioca 1kg', price: 8.99, cost: 6.50, stock: 80 },
    { type: 'Preto 1kg', price: 9.49, cost: 7.00, stock: 60 },
    { type: 'Branco 1kg', price: 11.20, cost: 8.50, stock: 30 },
    { type: 'Fradinho 500g', price: 6.50, cost: 4.80, stock: 40 }
  ];
  for (const b of beanBrands) {
    for (const t of beanTypes) {
      products.push({
        name: `Feijão ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const pastaBrands = ['Adria', 'Renata', 'Galo', 'Dona Benta', 'Barilla'];
  const pastaTypes = [
    { type: 'Espaguete 500g', price: 4.29, cost: 3.00, stock: 90 },
    { type: 'Parafuso 500g', price: 4.49, cost: 3.10, stock: 80 },
    { type: 'Pena 500g', price: 4.69, cost: 3.20, stock: 70 },
    { type: 'Lasanha 500g', price: 9.89, cost: 7.50, stock: 40 }
  ];
  for (const b of pastaBrands) {
    for (const t of pastaTypes) {
      products.push({
        name: `Macarrão ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 20,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const sugarBrands = ['União', 'Caravelas', 'Barra'];
  const sugarTypes = [
    { type: 'Refinado 1kg', price: 5.49, cost: 4.00, stock: 100 },
    { type: 'Cristal 1kg', price: 4.99, cost: 3.60, stock: 80 },
    { type: 'Demerara 1kg', price: 7.89, cost: 5.80, stock: 40 }
  ];
  for (const b of sugarBrands) {
    for (const t of sugarTypes) {
      products.push({
        name: `Açúcar ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 25,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const coffeeBrands = ['Melitta', 'Pilão', '3 Corações', 'Caboclo', 'Doutor'];
  const coffeeTypes = [
    { type: 'Tradicional 500g', price: 16.90, cost: 13.00, stock: 60 },
    { type: 'Extraforte 500g', price: 17.20, cost: 13.20, stock: 50 },
    { type: 'Descafeinado 250g', price: 14.50, cost: 11.00, stock: 25 }
  ];
  for (const b of coffeeBrands) {
    for (const t of coffeeTypes) {
      products.push({
        name: `Café ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const oilBrands = ['Liza', 'Soya', 'Coamo'];
  const oilTypes = [
    { type: 'Soja 900ml', price: 6.89, cost: 5.20, stock: 70 },
    { type: 'Girassol 900ml', price: 9.89, cost: 7.50, stock: 40 },
    { type: 'Milho 900ml', price: 10.49, cost: 8.00, stock: 35 }
  ];
  for (const b of oilBrands) {
    for (const t of oilTypes) {
      products.push({
        name: `Óleo ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 20,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const milkBrands = ['Elegê', 'Itambé', 'Piracanjuba', 'Nestlé'];
  const milkTypes = [
    { type: 'Integral 1L', price: 5.29, cost: 4.10, stock: 120 },
    { type: 'Semidesnatado 1L', price: 5.39, cost: 4.15, stock: 100 },
    { type: 'Desfatado 1L', price: 5.49, cost: 4.20, stock: 80 }
  ];
  for (const b of milkBrands) {
    for (const t of milkTypes) {
      products.push({
        name: `Leite ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 30,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const flourBrands = ['Dona Benta', 'Sol', 'Renata', 'Anaconda'];
  const flourTypes = [
    { type: 'De Trigo Especial 1kg', price: 5.89, cost: 4.20, stock: 50 },
    { type: 'De Trigo c/ Fermento 1kg', price: 6.49, cost: 4.80, stock: 40 },
    { type: 'De Mandioca Fina 1kg', price: 7.20, cost: 5.00, stock: 30 }
  ];
  for (const b of flourBrands) {
    for (const t of flourTypes) {
      products.push({
        name: `Farinha ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const sauceBrands = ['Pomarola', 'Heinz', 'Quero'];
  const sauceTypes = [
    { type: 'Tradicional Sachê 340g', price: 2.99, cost: 2.00, stock: 80 },
    { type: 'Bolonhesa Sachê 340g', price: 3.49, cost: 2.40, stock: 60 },
    { type: 'Manjericão Sachê 340g', price: 3.59, cost: 2.50, stock: 50 },
    { type: 'Extrato Lata 310g', price: 4.89, cost: 3.40, stock: 40 }
  ];
  for (const b of sauceBrands) {
    for (const t of sauceTypes) {
      products.push({
        name: `Molho de Tomate ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 20,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const oliveOilBrands = ['Andorinha', 'Gallo', 'Borges', 'Cocamar'];
  const oliveOilTypes = [
    { type: 'Extra Virgem 500ml', price: 32.90, cost: 25.00, stock: 30 },
    { type: 'Único Tipo Rústico 500ml', price: 28.90, cost: 22.00, stock: 20 },
    { type: 'Extra Virgem Vidro 250ml', price: 19.90, cost: 15.00, stock: 25 }
  ];
  for (const b of oliveOilBrands) {
    for (const t of oliveOilTypes) {
      products.push({
        name: `Azeite ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 8,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const cookieBrands = ['Bono', 'Negresco', 'Oreo', 'Passatempo'];
  const cookieTypes = [
    { type: 'Recheado Chocolate 130g', price: 3.20, cost: 2.20, stock: 60 },
    { type: 'Recheado Morango 130g', price: 3.20, cost: 2.20, stock: 50 },
    { type: 'Recheado Doce de Leite 130g', price: 3.20, cost: 2.20, stock: 40 }
  ];
  for (const b of cookieBrands) {
    for (const t of cookieTypes) {
      products.push({
        name: `Biscoito ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const crackerBrands = ['Vitarella', 'Marilan', 'Mabel'];
  const crackerTypes = [
    { type: 'Cream Cracker Tradicional 400g', price: 5.99, cost: 4.20, stock: 50 },
    { type: 'Água e Sal Tradicional 400g', price: 5.89, cost: 4.10, stock: 40 },
    { type: 'Gergelim Integral 400g', price: 6.49, cost: 4.60, stock: 30 }
  ];
  for (const b of crackerBrands) {
    for (const t of crackerTypes) {
      products.push({
        name: `Biscoito ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const chocoPowderBrands = ['Nescau', 'Toddy', 'Padre'];
  const chocoPowderTypes = [
    { type: 'Chocolate em Pó 400g', price: 8.49, cost: 6.00, stock: 50 },
    { type: 'Chocolate em Pó Sacola 800g', price: 15.90, cost: 12.00, stock: 30 },
    { type: 'Pronto Líquido 200ml', price: 2.89, cost: 1.90, stock: 100 }
  ];
  for (const b of chocoPowderBrands) {
    for (const t of chocoPowderTypes) {
      products.push({
        name: `Achocolatado ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const conserveBrands = ['Bonduelle', 'Quero', 'Fugini'];
  const conserveTypes = [
    { type: 'Milho Verde 170g', price: 3.49, cost: 2.30, stock: 65 },
    { type: 'Ervilha Doce 170g', price: 3.29, cost: 2.20, stock: 60 },
    { type: 'Dueto Especial 170g', price: 3.39, cost: 2.25, stock: 50 }
  ];
  for (const b of conserveBrands) {
    for (const t of conserveTypes) {
      products.push({
        name: `${t.type.split(' ')[0]} em Conserva ${b} ${t.type.split(' ').slice(1).join(' ')}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 12,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const spiceBrands = ['Knor', 'Maggi', 'Sazon'];
  const spiceTypes = [
    { type: 'Caldo de Carne c/12 tabletes', price: 4.29, cost: 3.00, stock: 100 },
    { type: 'Caldo de Galinha c/12 tabletes', price: 4.29, cost: 3.00, stock: 90 },
    { type: 'Tempero Sabor Nordeste c/12 saches', price: 4.89, cost: 3.40, stock: 80 }
  ];
  for (const b of spiceBrands) {
    for (const t of spiceTypes) {
      products.push({
        name: `Tempero ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 10,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const chocolateBrands = ['Lacta', 'Nestlé', 'Garoto'];
  const chocolateTypes = [
    { type: 'Barra Ao Leite 90g', price: 6.49, cost: 4.50, stock: 70 },
    { type: 'Barra Meio Amargo 90g', price: 6.99, cost: 4.80, stock: 60 },
    { type: 'Barra Branca 90g', price: 6.49, cost: 4.50, stock: 50 },
    { type: 'Caixa de Bombom Sortidos 250g', price: 13.90, cost: 10.50, stock: 100 }
  ];
  for (const b of chocolateBrands) {
    for (const t of chocolateTypes) {
      products.push({
        name: `Chocolate ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Alimentos',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  // --- 2. BEBIDAS ---
  const sodaBrands = ['Coca-Cola', 'Guaraná Antarctica', 'Fanta Laranja', 'Sprite', 'Pepsi'];
  const sodaSizes = [
    { type: 'Lata 350ml', price: 3.99, cost: 2.80, stock: 120 },
    { type: 'Garrafa 600ml', price: 5.49, cost: 3.80, stock: 80 },
    { type: 'Garrafa 2L', price: 9.99, cost: 7.50, stock: 100 },
    { type: 'Garrafa 2.5L', price: 11.49, cost: 8.60, stock: 60 }
  ];
  for (const b of sodaBrands) {
    for (const s of sodaSizes) {
      products.push({
        name: `Refrigerante ${b} ${s.type}`,
        barcode: nextBarcode(),
        category: 'Bebidas',
        price: s.price,
        averageCost: s.cost,
        costHistory: createInitialHistory(s.stock, s.cost),
        stock: s.stock,
        minStock: 24,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const beerBrands = ['Heineken', 'Stella Artois', 'Budweiser', 'Skol', 'Brahma', 'Amstel'];
  const beerFormats = [
    { type: 'Lata 350ml', price: 3.89, cost: 2.80, stock: 180 },
    { type: 'Long Neck 330ml', price: 5.49, cost: 4.00, stock: 120 },
    { type: 'Lata Latão 473ml', price: 4.99, cost: 3.60, stock: 150 }
  ];
  for (const b of beerBrands) {
    for (const f of beerFormats) {
      products.push({
        name: `Cerveja ${b} ${f.type}`,
        barcode: nextBarcode(),
        category: 'Bebidas',
        price: f.price,
        averageCost: f.cost,
        costHistory: createInitialHistory(f.stock, f.cost),
        stock: f.stock,
        minStock: 48,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const waterBrands = ['Crystal', 'Bonafont', 'Lindoya'];
  const waterFormats = [
    { type: 'Sem Gás 500ml', price: 1.99, cost: 1.10, stock: 200 },
    { type: 'Com Gás 500ml', price: 2.29, cost: 1.30, stock: 150 },
    { type: 'Sem Gás 1.5L', price: 3.29, cost: 1.80, stock: 100 }
  ];
  for (const b of waterBrands) {
    for (const w of waterFormats) {
      products.push({
        name: `Água Mineral ${b} ${w.type}`,
        barcode: nextBarcode(),
        category: 'Bebidas',
        price: w.price,
        averageCost: w.cost,
        costHistory: createInitialHistory(w.stock, w.cost),
        stock: w.stock,
        minStock: 24,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const juiceBrands = ['Ades', 'Del Valle', 'Maguary'];
  const juiceFlavors = [
    { type: 'Uva 1L', price: 6.89, cost: 4.80, stock: 60 },
    { type: 'Laranja 1L', price: 6.89, cost: 4.80, stock: 50 },
    { type: 'Pêssego 1L', price: 6.89, cost: 4.80, stock: 40 },
    { type: 'Manga 1L', price: 6.89, cost: 4.80, stock: 30 }
  ];
  for (const b of juiceBrands) {
    for (const j of juiceFlavors) {
      products.push({
        name: `Suco ${b} ${j.type}`,
        barcode: nextBarcode(),
        category: 'Bebidas',
        price: j.price,
        averageCost: j.cost,
        costHistory: createInitialHistory(j.stock, j.cost),
        stock: j.stock,
        minStock: 12,
        unit: 'un',
        supplier: supplierNames[2]
      });
    }
  }

  const energyBrands = ['Red Bull', 'Monster', 'TNT'];
  const energyVariations = [
    { type: 'Tradicional 250ml', price: 8.99, cost: 6.20, stock: 90 },
    { type: 'Energy Drink 473ml', price: 10.99, cost: 7.80, stock: 85 },
    { type: 'Sugar Free 250ml', price: 9.29, cost: 6.50, stock: 60 }
  ];
  for (const b of energyBrands) {
    for (const v of energyVariations) {
      products.push({
        name: `Energético ${b} ${v.type}`,
        barcode: nextBarcode(),
        category: 'Bebidas',
        price: v.price,
        averageCost: v.cost,
        costHistory: createInitialHistory(v.stock, v.cost),
        stock: v.stock,
        minStock: 12,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  // --- 3. LIMPEZA ---
  const detBrands = ['Ypê', 'Limpol', 'Minuano'];
  const detTypes = [
    { type: 'Neutro 500ml', price: 2.69, cost: 1.80, stock: 100 },
    { type: 'Maçã 500ml', price: 2.69, cost: 1.80, stock: 80 },
    { type: 'Coco 500ml', price: 2.69, cost: 1.80, stock: 90 },
    { type: 'Capim Limão 500ml', price: 2.69, cost: 1.80, stock: 70 }
  ];
  for (const b of detBrands) {
    for (const t of detTypes) {
      products.push({
        name: `Detergente Líquido ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Limpeza',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 20,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const soapCleanBrands = ['Omo', 'Ariel', 'Brilhante'];
  const soapCleanTypes = [
    { type: 'Pó Sanitizante 1.6kg', price: 24.90, cost: 18.00, stock: 45 },
    { type: 'Pó Multiação 800g', price: 13.90, cost: 10.00, stock: 60 },
    { type: 'Lava Roupas Líquido 1L', price: 19.90, cost: 14.00, stock: 40 }
  ];
  for (const b of soapCleanBrands) {
    for (const t of soapCleanTypes) {
      products.push({
        name: `Sabão ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Limpeza',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 10,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const softBrands = ['Downy', 'Comfort', 'Ypê'];
  const softTypes = [
    { type: 'Concentrado Perfume 1L', price: 17.90, cost: 13.00, stock: 40 },
    { type: 'Tradicional Azul 2L', price: 14.90, cost: 10.50, stock: 50 },
    { type: 'Concentrado Refil 500ml', price: 9.99, cost: 7.00, stock: 60 }
  ];
  for (const b of softBrands) {
    for (const t of softTypes) {
      products.push({
        name: `Amaciante de Roupas ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Limpeza',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 10,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const disBrands = ['Pinho Sol', 'Lysol', 'Veja'];
  const disAromas = [
    { type: 'Menta Fresca 500ml', price: 7.49, cost: 5.20, stock: 50 },
    { type: 'Lavanda Silvestre 500ml', price: 7.49, cost: 5.20, stock: 45 },
    { type: 'Eucalipto Natural 500ml', price: 7.49, cost: 5.20, stock: 40 }
  ];
  for (const b of disBrands) {
    for (const a of disAromas) {
      products.push({
        name: `Desinfetante ${b} ${a.type}`,
        barcode: nextBarcode(),
        category: 'Limpeza',
        price: a.price,
        averageCost: a.cost,
        costHistory: createInitialHistory(a.stock, a.cost),
        stock: a.stock,
        minStock: 10,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  // --- 4. HIGIENE ---
  const soapBrands = ['Dove', 'Rexona', 'Lux', 'Nivea'];
  const soapTypes = [
    { type: 'Original Barra 90g', price: 3.49, cost: 2.20, stock: 120 },
    { type: 'Lavanda Barra 90g', price: 3.49, cost: 2.20, stock: 100 },
    { type: 'Erva Doce Barra 90g', price: 3.49, cost: 2.20, stock: 90 },
    { type: 'Aveia e Mel Barra 90g', price: 3.49, cost: 2.20, stock: 80 }
  ];
  for (const b of soapBrands) {
    for (const t of soapTypes) {
      products.push({
        name: `Sabonete ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Higiene',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 25,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  const pasteBrands = ['Colgate', 'Oral-B', 'Sorriso', 'Sensodyne'];
  const pasteTypes = [
    { type: 'Tripla Ação 90g', price: 4.99, cost: 3.20, stock: 80 },
    { type: 'Menta Refrescante 90g', price: 4.49, cost: 2.90, stock: 70 },
    { type: 'Sensibilidade Alívio Rápido 90g', price: 14.90, cost: 10.50, stock: 40 }
  ];
  for (const b of pasteBrands) {
    for (const t of pasteTypes) {
      products.push({
        name: `Creme Dental ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Higiene',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 15,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const shampooBrands = ['Pantene', 'Seda', 'Dove', 'Head & Shoulders'];
  const shampooTypes = [
    { type: 'Shampoo Hidratação Extrema 350ml', price: 16.90, cost: 12.50, stock: 45 },
    { type: 'Shampoo Reconstrução Completa 350ml', price: 16.90, cost: 12.50, stock: 40 },
    { type: 'Shampoo Anticaspa Forte 350ml', price: 24.90, cost: 18.00, stock: 30 }
  ];
  for (const b of shampooBrands) {
    for (const t of shampooTypes) {
      products.push({
        name: `${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Higiene',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 10,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const condBrands = ['Pantene', 'Seda', 'Dove', 'Tresemme'];
  const condTypes = [
    { type: 'Condicionador Hidratação Extrema 350ml', price: 18.90, cost: 14.00, stock: 40 },
    { type: 'Condicionador Reconstrução Completa 350ml', price: 18.90, cost: 14.00, stock: 35 }
  ];
  for (const b of condBrands) {
    for (const t of condTypes) {
      products.push({
        name: `${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Higiene',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 10,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const deoBrands = ['Rexona', 'Nivea', 'Dove', 'Axe'];
  const deoTypes = [
    { type: 'Aerosol Masculino Active 150ml', price: 15.90, cost: 11.50, stock: 60 },
    { type: 'Aerosol Feminino Dry 150ml', price: 15.90, cost: 11.50, stock: 50 },
    { type: 'Aerosol Sem Perfume Hipoalergenico 150ml', price: 16.90, cost: 12.00, stock: 40 }
  ];
  for (const b of deoBrands) {
    for (const t of deoTypes) {
      products.push({
        name: `Desodorante ${b} ${t.type}`,
        barcode: nextBarcode(),
        category: 'Higiene',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 12,
        unit: 'un',
        supplier: supplierNames[1]
      });
    }
  }

  const careBrands = ['Sempre Livre', 'Intimus', 'Always'];
  const careTypes = [
    { type: 'Absorvente Normal Com Abas c/8', price: 5.99, cost: 4.00, stock: 100 },
    { type: 'Protetor Diário Conforto c/40', price: 11.90, cost: 8.50, stock: 50 },
    { type: 'Absorvente Noturno Noturno c/8', price: 8.90, cost: 6.00, stock: 60 }
  ];
  for (const b of careBrands) {
    for (const t of careTypes) {
      products.push({
        name: `${t.type.split(' ')[0]} ${b} ${t.type.split(' ').slice(1).join(' ')}`,
        barcode: nextBarcode(),
        category: 'Higiene',
        price: t.price,
        averageCost: t.cost,
        costHistory: createInitialHistory(t.stock, t.cost),
        stock: t.stock,
        minStock: 20,
        unit: 'un',
        supplier: supplierNames[0]
      });
    }
  }

  // --- 5. OUTROS ---
  const freshItems = [
    { name: 'Banana Prata', price: 6.99, cost: 4.50, unit: 'kg' },
    { name: 'Banana Nanica', price: 5.99, cost: 3.80, unit: 'kg' },
    { name: 'Tomate Italiano', price: 8.99, cost: 6.00, unit: 'kg' },
    { name: 'Tomate Cereja Bandeja 250g', price: 4.99, cost: 3.20, unit: 'un' },
    { name: 'Batata Inglesa', price: 5.99, cost: 4.00, unit: 'kg' },
    { name: 'Batata Doce', price: 4.89, cost: 3.00, unit: 'kg' },
    { name: 'Cebola Nacional', price: 5.49, cost: 3.50, unit: 'kg' },
    { name: 'Cebola Roxa', price: 7.89, cost: 5.20, unit: 'kg' },
    { name: 'Alho Roxo Cabeça 100g', price: 3.99, cost: 2.50, unit: 'un' },
    { name: 'Maçã Gala', price: 9.99, cost: 6.80, unit: 'kg' },
    { name: 'Maçã Verde Importada', price: 14.90, cost: 10.00, unit: 'kg' },
    { name: 'Limão Taiti', price: 4.99, cost: 3.00, unit: 'kg' },
    { name: 'Limão Siciliano', price: 12.90, cost: 9.00, unit: 'kg' },
    { name: 'Laranja Pera', price: 4.49, cost: 2.80, unit: 'kg' },
    { name: 'Cenoura Nacional', price: 5.99, cost: 3.80, unit: 'kg' },
    { name: 'Abobrinha Italiana', price: 4.89, cost: 3.20, unit: 'kg' },
    { name: 'Pimentão Verde', price: 6.49, cost: 4.20, unit: 'kg' },
    { name: 'Mamão Formosa', price: 7.99, cost: 5.50, unit: 'kg' }
  ];
  for (const item of freshItems) {
    products.push({
      name: item.name,
      barcode: nextBarcode(),
      category: 'Outros',
      price: item.price,
      averageCost: item.cost,
      costHistory: createInitialHistory(25, item.cost),
      stock: 25,
      minStock: 5,
      unit: item.unit,
      supplier: supplierNames[2]
    });
  }

  const meatItems = [
    { name: 'Peito de Frango Resfriado Seara 1kg', price: 19.90, cost: 14.00 },
    { name: 'Coxa e Sobrecoxa de Frango Seara 1kg', price: 12.90, cost: 9.00 },
    { name: 'Carne Moída Patinho Bovino 1kg', price: 38.90, cost: 29.00 },
    { name: 'Bife de Alcatra Bovino 1kg', price: 44.90, cost: 33.00 },
    { name: 'Contra Filé Bovino Grill 1kg', price: 49.90, cost: 38.00 },
    { name: 'Costela Suína Sadia Resfriada 1kg', price: 29.90, cost: 21.00 },
    { name: 'Linguiça Toscana Perdigão 1kg', price: 18.90, cost: 13.50 },
    { name: 'Salsicha Hot Dog Perdigão 1kg', price: 11.90, cost: 8.50 },
    { name: 'Filé de Tilápia Congelado Copacol 500g', price: 28.90, cost: 20.00 },
    { name: 'Hambúrguer Bovino Perdigão Caixa c/12', price: 16.90, cost: 12.00 },
    { name: 'Bacon Defumado Sadia 500g', price: 18.90, cost: 13.50 },
    { name: 'Carne Seca Bovina Salgada 1kg', price: 42.90, cost: 32.00 }
  ];
  for (const meat of meatItems) {
    products.push({
      name: meat.name,
      barcode: nextBarcode(),
      category: 'Outros',
      price: meat.price,
      averageCost: meat.cost,
      costHistory: createInitialHistory(20, meat.cost),
      stock: 20,
      minStock: 4,
      unit: 'un',
      supplier: supplierNames[0]
    });
  }

  const coldItems = [
    { name: 'Queijo Mussarela Fatiado 200g', price: 13.90, cost: 10.50 },
    { name: 'Presunto Cozido Sadia Fatiado 200g', price: 7.99, cost: 5.80 },
    { name: 'Mortadela Ceratti Fatiada 200g', price: 6.49, cost: 4.50 },
    { name: 'Salame Italiano Sadia Fatiado 100g', price: 11.90, cost: 8.00 },
    { name: 'Requeijão Cremoso Poços de Caldas 200g', price: 8.49, cost: 6.00 },
    { name: 'Margarina Qualy Com Sal 500g', price: 7.99, cost: 5.50 },
    { name: 'Manteiga Com Sal Aviação Vidro 200g', price: 12.90, cost: 9.50 },
    { name: 'Creme de Ricota Light Tirolez 200g', price: 7.49, cost: 5.00 },
    { name: 'Queijo Prato Fatiado Lacta 200g', price: 14.50, cost: 11.00 },
    { name: 'Iogurte Sabor Morango Batavo 800g', price: 9.90, cost: 7.00 },
    { name: 'Iogurte Grego Morango Vigor 100g', price: 3.49, cost: 2.20 },
    { name: 'Iogurte Grego Tradicional Vigor 100g', price: 3.49, cost: 2.20 }
  ];
  for (const cold of coldItems) {
    products.push({
      name: cold.name,
      barcode: nextBarcode(),
      category: 'Outros',
      price: cold.price,
      averageCost: cold.cost,
      costHistory: createInitialHistory(30, cold.cost),
      stock: 30,
      minStock: 5,
      unit: 'un',
      supplier: supplierNames[1]
    });
  }

  const bakeryItems = [
    { name: 'Pão Francês Crocante', price: 0.75, cost: 0.40, unit: 'un' },
    { name: 'Pão de Queijo Assado Quente 100g', price: 4.50, cost: 2.80, unit: 'un' },
    { name: 'Bolo Caseiro de Cenoura c/ Chocolate', price: 14.90, cost: 10.00, unit: 'un' },
    { name: 'Bolo Caseiro de Fubá Vovó', price: 11.90, cost: 8.00, unit: 'un' },
    { name: 'Pão de Forma Integral Wickbold 500g', price: 9.90, cost: 7.00, unit: 'un' },
    { name: 'Pão Doce de Creme Confeitado', price: 2.50, cost: 1.50, unit: 'un' },
    { name: 'Broa de Milho Tradicional', price: 1.90, cost: 1.10, unit: 'un' },
    { name: 'Croissant Recheado Presunto e Queijo', price: 7.50, cost: 5.00, unit: 'un' }
  ];
  for (const bake of bakeryItems) {
    products.push({
      name: bake.name,
      barcode: nextBarcode(),
      category: 'Outros',
      price: bake.price,
      averageCost: bake.cost,
      costHistory: createInitialHistory(80, bake.cost),
      stock: 80,
      minStock: 15,
      unit: bake.unit,
      supplier: supplierNames[1]
    });
  }

  return products;
}

async function main() {
  console.log("Iniciando seed do banco de dados...");

  let defaultStore = await prisma.store.findFirst();
  if (!defaultStore) {
    defaultStore = await prisma.store.create({
      data: {
        name: "Loja Principal",
        cnpj: "00.000.000/0001-00",
        address: "Rua Principal, 123",
        phone: "(11) 99999-9999",
      }
    });
    console.log("Loja padrão criada:", defaultStore.name);
  }

  // Create suppliers
  for (const supplier of mockSuppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: supplier.name } });
    if (!existing) {
      await prisma.supplier.create({
        data: {
          name: supplier.name,
          contactName: supplier.contactName || null,
          phone: supplier.phone || null,
          email: supplier.email || null,
          storeId: defaultStore.id,
        }
      });
    }
  }

  // Create Admin
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashedAdminPassword = bcrypt.hashSync('123456', 10);
    await prisma.user.create({
      data: {
        uid: 'admin-default-uid',
        name: 'Administrador Alvorada',
        email: 'admin@alvorada.com',
        passwordHash: hashedAdminPassword,
        role: 'Administrador',
        storeId: defaultStore.id,
      }
    });
    console.log("Administrador padrão criado: admin@alvorada.com / 123456");
  }

  // Get next SKU number
  const counterDoc = await prisma.systemConfig.findUnique({ where: { key: 'products_counter' } });
  let lastSku = 0;
  if (counterDoc && counterDoc.value) {
    lastSku = ((counterDoc.value as any).lastSku || 0);
  } else {
    const maxProduct = await prisma.product.findFirst({
      orderBy: { sku: 'desc' }
    });
    if (maxProduct && !isNaN(Number(maxProduct.sku))) {
      lastSku = Number(maxProduct.sku);
    }
  }

  const existingProducts = await prisma.product.findMany({ select: { name: true } });
  const existingNamesSet = new Set(existingProducts.map(p => p.name));

  const allProducts = generateProducts();
  const productsToInsert = allProducts.filter(p => !existingNamesSet.has(p.name));

  if (productsToInsert.length > 0) {
    const dataToInsert = productsToInsert.map((p, index) => {
      const skuNumber = lastSku + index + 1;
      return {
        name: p.name,
        sku: String(skuNumber),
        status: 'Ativo',
        category: p.category,
        price: p.price,
        averageCost: p.averageCost,
        costHistory: p.costHistory as any,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        supplier: p.supplier,
        barcode: p.barcode || null,
        imageUrl: p.imageUrl || null,
        storeId: defaultStore.id,
      };
    });

    await prisma.product.createMany({
      data: dataToInsert
    });

    const nextSku = lastSku + productsToInsert.length;
    await prisma.systemConfig.upsert({
      where: { key: 'products_counter' },
      update: { value: { lastSku: nextSku } },
      create: { key: 'products_counter', value: { lastSku: nextSku } },
    });

    console.log(`Seed: Inseridos ${productsToInsert.length} novos produtos. Novo lastSku: ${nextSku}`);
  } else {
    console.log("Todos os produtos do seed já existem no banco.");
  }

  // Configurations
  await prisma.systemConfig.upsert({
    where: { key: 'config' },
    update: { value: { cancellationPassword: '1234' } },
    create: { key: 'config', value: { cancellationPassword: '1234' } },
  });

  // Mark as seeded
  await prisma.systemConfig.upsert({
    where: { key: 'flags' },
    update: { value: { seeded_v2: true } },
    create: { key: 'flags', value: { seeded_v2: true } },
  });

  console.log("Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
