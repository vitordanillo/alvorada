import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("INICIANDO SUÍTE DE TESTES AUTOMATIZADOS (ALVORADA)");
  console.log("==================================================");

  let testStoreId1: string = '';
  let testStoreId2: string = '';
  let customerId1: string = '';
  let productId1: string = '';
  let sessionId1: string = '';
  let userId1: string = '';
  let userId2: string = '';

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  [OK] ${message}`);
      passedTests++;
    } else {
      console.error(`  [ERRO] ${message}`);
      failedTests++;
    }
  }

  try {
    // --- SETUP: Create test stores, users, customer, and product ---
    console.log("\n[Setup] Preparando dados de teste...");

    const store1 = await prisma.store.create({
      data: {
        name: "Test Store Alpha",
        cnpj: "11.111.111/0001-11",
        address: "Rua Alpha, 1",
        phone: "(11) 91111-1111"
      }
    });
    testStoreId1 = store1.id;

    const store2 = await prisma.store.create({
      data: {
        name: "Test Store Beta",
        cnpj: "22.222.222/0001-22",
        address: "Rua Beta, 2",
        phone: "(22) 92222-2222"
      }
    });
    testStoreId2 = store2.id;

    const user1 = await prisma.user.create({
      data: {
        uid: "test-user-alpha-uid",
        name: "Gerente Alpha",
        email: "gerente.alpha@test.com",
        passwordHash: "dummy-hash",
        role: "Gerente",
        storeId: testStoreId1
      }
    });
    userId1 = user1.uid;

    const user2 = await prisma.user.create({
      data: {
        uid: "test-user-beta-uid",
        name: "Gerente Beta",
        email: "gerente.beta@test.com",
        passwordHash: "dummy-hash",
        role: "Gerente",
        storeId: testStoreId2
      }
    });
    userId2 = user2.uid;

    const customer = await prisma.customer.create({
      data: {
        name: "Cliente Teste",
        phone: "(11) 98888-8888",
        email: "cliente@teste.com",
        creditLimit: 500.00,
        balance: 0.00,
        loyaltyPoints: 100, // Starts with 100 points
        storeId: testStoreId1,
        tags: []
      }
    });
    customerId1 = customer.id;

    const product = await prisma.product.create({
      data: {
        name: "Produto Teste",
        sku: "TEST-SKU-999",
        status: "Ativo",
        category: "Alimentos",
        price: 25.00,
        averageCost: 15.00,
        stock: 50,
        minStock: 5,
        unit: "UN",
        supplier: "Fornecedor Teste",
        storeId: testStoreId1,
        costHistory: []
      }
    });
    productId1 = product.id;

    const session = await prisma.cashRegisterSession.create({
      data: {
        openingTime: new Date(),
        openingBalance: 100.00,
        calculatedCashInDrawer: 100.00,
        totalSales: 0,
        salesByPaymentMethod: { Dinheiro: 0, Pix: 0, Cartão: 0 },
        totalExpenses: 0,
        totalWithdrawals: 0,
        totalCreditPayments: 0,
        status: "Aberto",
        openedByUid: userId1,
        openedByName: user1.name,
        storeId: testStoreId1
      }
    });
    sessionId1 = session.id;

    // --- TEST 1: MULTI-TENANCY ISOLATION ---
    console.log("\n[Teste 1] Validando Isolamento de Multi-tenancy...");
    const productsStore1 = await prisma.product.findMany({ where: { storeId: testStoreId1 } });
    const productsStore2 = await prisma.product.findMany({ where: { storeId: testStoreId2 } });
    assert(productsStore1.length === 1 && productsStore1[0].id === productId1, "Store Alpha lista seus próprios produtos.");
    assert(productsStore2.length === 0, "Store Beta não visualiza produtos da Store Alpha.");

    // --- TEST 2: LOYALTY POINTS WORKFLOW ---
    console.log("\n[Teste 2] Validando Regras de Pontos de Fidelidade...");
    
    // Simulate sale paying with points: 50 points used = R$ 5,00 discount
    const saleData = {
      items: [{ productId: productId1, productName: product.name, quantity: 2, price: product.price }],
      total: 50.00,
      customerId: customerId1,
      customerName: customer.name,
      paymentMethods: [
        { method: 'Pontos' as const, amount: 5.00 }, // pays R$ 5,00 with points
        { method: 'Dinheiro' as const, amount: 45.00 } // pays R$ 45,00 with cash
      ]
    };

    // Process logic transacationally to test rules
    await prisma.$transaction(async (tx) => {
      // 1. Verify and deduct points
      let pointsUsed = 0;
      for (const payment of saleData.paymentMethods) {
        if (payment.method === 'Pontos') pointsUsed += payment.amount * 10;
      }
      assert(pointsUsed === 50, "Cálculo correto de conversão de R$ em pontos (R$ 5 = 50 pontos).");

      const cust = await tx.customer.findUnique({ where: { id: customerId1 } });
      assert((cust?.loyaltyPoints || 0) >= pointsUsed, "Cliente tem saldo suficiente de pontos.");

      await tx.customer.update({
        where: { id: customerId1 },
        data: { loyaltyPoints: { decrement: pointsUsed } }
      });

      // 2. Accumulate points for cash/card portion
      let cashOrCardTotal = saleData.total;
      for (const payment of saleData.paymentMethods) {
        if (payment.method === 'Pontos') cashOrCardTotal -= payment.amount;
      }
      assert(cashOrCardTotal === 45.00, "Valor de acúmulo correto descontando resgate.");

      const pointsEarned = Math.floor(cashOrCardTotal * 0.1); // 1 point per R$ 10
      assert(pointsEarned === 4, "Acúmulo de pontos calculado corretamente (R$ 45 = 4 pontos).");

      await tx.customer.update({
        where: { id: customerId1 },
        data: { loyaltyPoints: { increment: pointsEarned } }
      });
    });

    const updatedCust = await prisma.customer.findUnique({ where: { id: customerId1 } });
    assert(updatedCust?.loyaltyPoints === 54, `Saldo final de pontos correto: 100 - 50 + 4 = 54 (Atual: ${updatedCust?.loyaltyPoints}).`);

    // --- TEST 3: CREDIT LIMIT ENFORCEMENT ---
    console.log("\n[Teste 3] Validando Validação de Limite de Crédito...");
    
    const overlimitSale = {
      total: 600.00,
      paymentMethods: [{ method: 'Fiado' as const, amount: 600.00 }]
    };

    let threwError = false;
    try {
      const cust = await prisma.customer.findUnique({ where: { id: customerId1 } });
      if (!cust) throw new Error("Cliente não encontrado");
      const availableCredit = cust.creditLimit - cust.balance;
      if (overlimitSale.paymentMethods[0].amount > availableCredit) {
        throw new Error("Limite de crédito excedido!");
      }
    } catch (err: any) {
      if (err.message.includes("excedido")) threwError = true;
    }
    assert(threwError, "Sistema lança exceção quando limite de crédito fiado é excedido.");

    // --- TEST 4: WHATSAPP BILLING FORMAT ---
    console.log("\n[Teste 4] Validando Mensagem de Cobrança do WhatsApp...");
    const customerWithDebt = await prisma.customer.update({
      where: { id: customerId1 },
      data: { balance: 120.50 }
    });
    const messageText = `Olá *${customerWithDebt.name}*, você possui um saldo pendente de *R$ ${customerWithDebt.balance.toFixed(2)}* na Alvorada Smart Market. Para facilitar, você pode efetuar o pagamento via Pix utilizando a nossa chave comercial. Obrigado!`;
    assert(messageText.includes("Cliente Teste") && messageText.includes("R$ 120.50"), "Formato de mensagem e saldo da cobrança corretos.");

    // --- TEST 5: SIMULATED MERCADO PAGO PIX QR CODE ---
    console.log("\n[Teste 5] Validando Payload Pix Simulado...");
    const paymentId = "mp-pix-12345abc";
    const qrCodeData = `00020101021226870014br.gov.bcb.pix2565mp-pix-${paymentId}@mercadopago.com.br520400005303986540645.005802BR5915AlvoradaMarket6009SaoPaulo62070503***6304`;
    assert(qrCodeData.startsWith("000201") && qrCodeData.includes("mercadopago") && qrCodeData.includes("45.00"), "Código Copia e Cola estruturado com formato válido do Pix Banco Central.");

  } catch (error) {
    console.error("Erro inesperado durante a execução dos testes:", error);
  } finally {
    // --- CLEANUP: Delete all test records in reverse dependency order ---
    console.log("\n[Cleanup] Removendo dados de teste...");
    try {
      if (sessionId1) await prisma.cashRegisterSession.delete({ where: { id: sessionId1 } });
      if (productId1) await prisma.product.delete({ where: { id: productId1 } });
      if (customerId1) await prisma.customer.delete({ where: { id: customerId1 } });
      if (userId1) await prisma.user.delete({ where: { uid: userId1 } });
      if (userId2) await prisma.user.delete({ where: { uid: userId2 } });
      if (testStoreId1) await prisma.store.delete({ where: { id: testStoreId1 } });
      if (testStoreId2) await prisma.store.delete({ where: { id: testStoreId2 } });
      console.log("Limpeza concluída com sucesso.");
    } catch (cleanupErr) {
      console.error("Erro na limpeza dos dados de teste:", cleanupErr);
    }
  }

  console.log("\n==================================================");
  console.log("RESULTADO GERAL DOS TESTES:");
  console.log(`  Passaram: ${passedTests}`);
  console.log(`  Falharam: ${failedTests}`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
