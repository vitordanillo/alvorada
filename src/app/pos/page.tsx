
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Product, Customer, Sale } from '@/lib/types';
import { Logo } from '@/components/icons/logo';
import { Search, Plus, Minus, ArrowLeft, Loader2, AlertTriangle, User, FilePen, Barcode, Trash2, Coins, CreditCard, Pizza, Gift, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useAppContext, useAuth } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { CustomerSelectionDialog } from '@/components/pos/customer-selection-dialog';
import { ReceiptDialog } from '@/components/sales/receipt-dialog';
import { ToastAction } from '@/components/ui/toast';
import { BarcodeScannerDialog } from '@/components/pos/barcode-scanner-dialog';
import { cn } from '@/lib/utils';


type CartItem = Product & { quantity: number };
type Payment = { method: 'Dinheiro' | 'Pix' | 'Cartão' | 'Fiado' | 'Pontos'; amount: number; };

const defaultCustomer = { id: 'default', name: 'Cliente Balcão', balance: 0, creditLimit: 0, phone: '', loyaltyPoints: 0 };

export default function POSPage() {
  const router = useRouter();
  const { user, loadingAuth } = useAuth();
  const { products, customers, addSale, activeSession } = useAppContext();
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('Todos');
  const [isFinishing, setIsFinishing] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'Administrador' && user.role !== 'Gerente' && user.role !== 'Operador de Caixa') {
        toast({
          variant: 'destructive',
          title: 'Acesso Negado',
          description: 'Seu usuário não possui permissão para acessar o PDV.',
        });
        router.push('/dashboard');
      }
    }
  }, [user, loadingAuth, router, toast]);

  if (loadingAuth || !user || (user.role !== 'Administrador' && user.role !== 'Gerente' && user.role !== 'Operador de Caixa')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer>(defaultCustomer);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = React.useState(false);

  const [saleForReceipt, setSaleForReceipt] = React.useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);

  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [currentPaymentAmount, setCurrentPaymentAmount] = React.useState('');

  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);


  const categories = ['Todos', 'Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'];

  const addToCart = React.useCallback((product: Product) => {
    if (!activeSession) {
      toast({
        variant: "destructive",
        title: "Caixa Fechado",
        description: "É necessário abrir o caixa para iniciar uma venda.",
      });
      return;
    }

    if (product.stock <= 0) {
      toast({
        variant: 'destructive',
        title: 'Fora de estoque',
        description: `${product.name} não está disponível.`,
      });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({
            variant: 'destructive',
            title: 'Limite de estoque',
            description: `Não há mais estoque de ${product.name}.`,
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  }, [activeSession, toast]);
  
  // Effect to handle automatic product addition from USB scanner
  React.useEffect(() => {
    // A quick scan is usually a barcode. Check for an exact match.
    // A length check helps prevent this from running on short, manual searches.
    if (searchTerm.length > 5) {
      const matchedProduct = products.find(p => p.barcode === searchTerm);
      if (matchedProduct) {
        addToCart(matchedProduct);
        setSearchTerm(''); // Reset for the next scan
        toast({
          title: "Produto Adicionado",
          description: `${matchedProduct.name} foi adicionado via scanner.`,
        });
      }
    }
  }, [searchTerm, products, addToCart, toast]);


  const updateQuantity = (productId: string, amount: number) => {
    const itemInCart = cart.find((item) => item.id === productId);
    if (!itemInCart) return;

    const productInStock = products.find((p) => p.id === productId);
    const newQuantity = itemInCart.quantity + amount;

    if (amount > 0 && productInStock && newQuantity > productInStock.stock) {
      toast({
        variant: 'destructive',
        title: 'Limite de estoque',
        description: `Não há mais estoque de ${productInStock.name}.`,
      });
      return;
    }

    setCart((prevCart) => {
      const updatedCart = prevCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
        .filter((item) => item.quantity > 0);
      return updatedCart;
    });
  };
  
  const handleFinishPurchase = async () => {
    setIsFinishing(true);
    try {
        const newSaleData = {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          paymentMethods: payments,
          total: subtotal,
          items: cart.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        };

        const newSale = await addSale(newSaleData);

        setCart([]);
        setSelectedCustomer(defaultCustomer);
        setPayments([]);
        setCurrentPaymentAmount('');
        setIsPaymentDialogOpen(false);
        
        toast({
          title: 'Compra finalizada com sucesso!',
          description: `Venda ${newSale.id} registrada.`,
          action: <ToastAction altText="Ver Recibo" onClick={() => handleViewReceipt(newSale)}>Ver Recibo</ToastAction>,
          className: 'bg-green-100 border-green-500 text-green-800'
        });

    } catch (error) {
        console.error("Failed to finish purchase: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: error instanceof Error ? error.message : 'Não foi possível registrar a venda. Tente novamente.'
        })
    } finally {
        setIsFinishing(false);
    }
  };

  const handleViewReceipt = (sale: Sale) => {
    setSaleForReceipt(sale);
    setIsReceiptOpen(true);
  };

  const handleScanSuccess = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      toast({
        title: "Produto Adicionado",
        description: `${product.name} foi adicionado ao carrinho.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Produto não encontrado",
        description: `Nenhum produto com o código de barras "${barcode}" foi encontrado.`,
      });
    }
    setIsScannerOpen(false); // Close the scanner dialog
  };

  const filteredProducts = products.filter(p => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const termIsPresent = searchTerm.length > 0;

    const nameMatch = p.name.toLowerCase().includes(lowerCaseSearchTerm);
    const skuMatch = p.sku && p.sku.toLowerCase().includes(lowerCaseSearchTerm);
    const barcodeMatch = p.barcode && p.barcode.includes(searchTerm);

    const matchesSearch = !termIsPresent || nameMatch || skuMatch || barcodeMatch;

    return p.status === 'Ativo' &&
      (activeCategory === 'Todos' || p.category === activeCategory) &&
      matchesSearch;
  });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingAmount = subtotal - totalPaid;

  const handleAddPayment = async (method: Payment['method']) => {
    const amount = parseFloat(currentPaymentAmount.replace(',', '.')) || 0;
    if (amount <= 0) {
      toast({ variant: 'destructive', title: 'Valor inválido' });
      return;
    }
    
    const isOverpaying = amount > remainingAmount + 0.001;
    if (isOverpaying && method !== 'Dinheiro') {
        toast({ variant: 'destructive', title: 'Valor excede o restante', description: 'Apenas pagamentos em dinheiro podem ter troco.' });
        return;
    }

    if (method === 'Fiado') {
        if (selectedCustomer.id === 'default') {
            toast({ variant: 'destructive', title: 'Selecione um cliente', description: 'Vendas a prazo precisam de um cliente cadastrado.'});
            return;
        }
        const availableCredit = selectedCustomer.creditLimit - selectedCustomer.balance;
        if (amount > availableCredit) {
            toast({ variant: 'destructive', title: 'Limite de crédito excedido', description: `O cliente não tem limite suficiente. Limite disponível: R$ ${availableCredit.toFixed(2)}` });
            return;
        }
    }

    if (method === 'Pontos') {
        if (selectedCustomer.id === 'default') {
            toast({ variant: 'destructive', title: 'Selecione um cliente' });
            return;
        }
        const pointsNeeded = amount * 10;
        const availablePoints = selectedCustomer.loyaltyPoints || 0;
        if (pointsNeeded > availablePoints) {
            toast({ variant: 'destructive', title: 'Pontos insuficientes', description: `O cliente possui ${availablePoints} pontos (R$ ${(availablePoints/10).toFixed(2)}), mas tentando pagar R$ ${amount.toFixed(2)} (${pointsNeeded} pontos).` });
            return;
        }
    }

    if (method === 'Pix') {
      toast({
        variant: 'destructive',
        title: 'Pix ainda não está configurado',
        description: 'Use outro meio de pagamento até conectar um provedor Pix real.',
      });
      return;
    }

    setPayments(prev => [...prev, { method, amount }]);
    setCurrentPaymentAmount('');
  };

  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handlePaymentDialogToggle = (open: boolean) => {
    setIsPaymentDialogOpen(open);
    if (!open) {
        setPayments([]);
        setCurrentPaymentAmount('');
    }
  }


  const isCheckoutDisabled = cart.length === 0 || isFinishing || !activeSession;
  const isConfirmDisabled = isFinishing || remainingAmount > 0.001;


  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 h-screen">
        {/* Product Selection */}
        <div className="lg:col-span-2 bg-background p-6 flex flex-col h-screen">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg" prefetch={false}>
                  <ArrowLeft className="h-5 w-5" />
                  Voltar ao Dashboard
              </Link>
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full",
                isOnline ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
              )}>
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div className="relative flex-1 max-w-sm ml-4 flex items-center gap-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome, SKU ou cód. de barras..." 
                className="pl-10 rounded-full" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
               <Button variant="outline" size="icon" className="rounded-full flex-shrink-0" onClick={() => setIsScannerOpen(true)}>
                <Barcode className="h-5 w-5" />
                <span className="sr-only">Escanear Código de Barras</span>
              </Button>
            </div>
          </header>
          <div className="mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(category)}
                  className="rounded-full flex-shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts
                .map((product) => (
                <Card
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="cursor-pointer hover:shadow-lg transition-shadow rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-0">
                    <Image
                      src={`https://placehold.co/200x200.png`}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="object-cover w-full h-32"
                      data-ai-hint={`${product.category} product`}
                    />
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <p className="font-bold font-headline text-lg">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </p>
                      <p className={`text-xs ${product.stock > 0 ? 'text-muted-foreground' : 'text-destructive font-semibold'}`}>
                        {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Cart */}
        <div className="bg-secondary p-6 flex flex-col h-screen">
          <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <Logo className="w-10 h-10 text-primary" />
                <h2 className="text-2xl font-bold font-headline">Pedido Atual</h2>
              </div>
          </div>
          
           <Card className="rounded-2xl border-primary/20 border-2 bg-primary/5 mb-4">
                <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-semibold">{selectedCustomer.name}</p>
                            {selectedCustomer.id !== 'default' && (
                                <p className="text-xs text-muted-foreground">
                                    Saldo Devedor: R$ {selectedCustomer.balance.toFixed(2).replace('.',',')}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsCustomerDialogOpen(true)}>
                        <FilePen className="h-4 w-4 mr-2"/>
                        Trocar
                    </Button>
                </CardContent>
            </Card>

          <Card className="flex-1 flex flex-col rounded-2xl bg-background">
            <CardHeader>
              <CardTitle>Itens no Carrinho</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent>
                {!activeSession && (
                   <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Caixa Fechado</AlertTitle>
                      <AlertDescription>
                        É necessário abrir o caixa no dashboard para registrar vendas.
                      </AlertDescription>
                    </Alert>
                )}
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center mt-10">Seu carrinho está vazio.</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <Image
                          src={`https://placehold.co/64x64.png`}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="rounded-md"
                          data-ai-hint={`${item.category} product`}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-muted-foreground text-sm">
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </ScrollArea>
            <CardFooter className="flex flex-col gap-4 mt-auto p-6 bg-secondary/50">
              <div className="w-full flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <Separator />
              <div className="w-full flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="font-headline">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <AlertDialog open={isPaymentDialogOpen} onOpenChange={handlePaymentDialogToggle}>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="w-full font-bold text-lg py-7 mt-2 rounded-xl" disabled={isCheckoutDisabled}>
                    Finalizar Compra
                  </Button>
                </AlertDialogTrigger>
                 <AlertDialogContent className="sm:max-w-lg">
                    <AlertDialogHeader>
                    <AlertDialogTitle>Pagamento</AlertDialogTitle>
                    <AlertDialogDescription>
                        Adicione um ou mais métodos de pagamento para quitar o valor total.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className='space-y-4'>
                       <div className="flex justify-between items-baseline p-4 rounded-lg bg-muted">
                            <div>
                               <p className="text-sm text-muted-foreground">Total a Pagar</p>
                               <p className="text-2xl font-bold font-headline">R$ {subtotal.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className="text-right">
                                {remainingAmount > 0 ? (
                                    <>
                                        <p className="text-sm text-muted-foreground">Restante</p>
                                        <p className="text-2xl font-bold font-headline text-destructive">
                                            R$ {remainingAmount.toFixed(2).replace('.', ',')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">Troco</p>
                                        <p className="text-2xl font-bold font-headline text-green-600">
                                            R$ {Math.abs(remainingAmount).toFixed(2).replace('.', ',')}
                                        </p>
                                    </>
                                )}
                            </div>
                       </div>

                       <div className="space-y-2">
                           <Label htmlFor="payment-amount">Valor a Pagar</Label>
                           <div className="flex gap-2">
                                <Input 
                                    id="payment-amount"
                                    placeholder='0,00'
                                    value={currentPaymentAmount}
                                    onChange={e => setCurrentPaymentAmount(e.target.value)}
                                    className="text-lg h-12"
                                />
                                <Button variant="outline" onClick={() => setCurrentPaymentAmount(remainingAmount > 0 ? remainingAmount.toFixed(2).replace('.',',') : '')}>
                                    Usar Restante
                                </Button>
                           </div>
                       </div>
                       
                        <div className="grid grid-cols-2 gap-2">
                           <Button variant="outline" className="h-12" onClick={() => handleAddPayment('Dinheiro')}><Coins className="mr-2"/> Dinheiro</Button>
                           <Button variant="outline" className="h-12" onClick={() => handleAddPayment('Cartão')}><CreditCard className="mr-2"/> Cartão</Button>
                           <Button variant="outline" className="h-12" onClick={() => handleAddPayment('Pix')}><Pizza className="mr-2"/> Pix indisponível</Button>
                           <Button variant="outline" className="h-12" onClick={() => handleAddPayment('Fiado')}><FilePen className="mr-2"/> Fiado</Button>
                            {selectedCustomer.id !== 'default' && (selectedCustomer.loyaltyPoints || 0) > 0 && (
                              <Button variant="outline" className="h-12 col-span-2 border-primary text-primary hover:bg-primary/5" onClick={() => handleAddPayment('Pontos')}>
                                <Gift className="mr-2 h-4 w-4"/> Usar Pontos (Saldo: {selectedCustomer.loyaltyPoints} pts = R$ {((selectedCustomer.loyaltyPoints || 0) / 10).toFixed(2).replace('.', ',')})
                              </Button>
                            )}
                       </div>

                        {payments.length > 0 && (
                            <div className="space-y-2">
                                <Label>Pagamentos Adicionados</Label>
                                <div className="space-y-2">
                                {payments.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                        <div className="flex items-center gap-2">
                                            {p.method === 'Dinheiro' && <Coins className="text-green-600"/>}
                                            {p.method === 'Cartão' && <CreditCard className="text-blue-600"/>}
                                            {p.method === 'Pix' && <Pizza className="text-cyan-600"/>}
                                            {p.method === 'Fiado' && <FilePen className="text-orange-600"/>}
                                            {p.method === 'Pontos' && <Gift className="text-pink-600 h-5 w-5"/>}
                                            <span>{p.method}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">R$ {p.amount.toFixed(2).replace('.',',')}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemovePayment(i)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isFinishing}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFinishPurchase} disabled={isConfirmDisabled}>
                        {isFinishing ? <Loader2 className="animate-spin" /> : 'Confirmar Compra'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </div>

      <CustomerSelectionDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        customers={customers}
        onSelectCustomer={(customer) => setSelectedCustomer(customer)}
      />

      <ReceiptDialog 
        sale={saleForReceipt}
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
      />

      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScanSuccess={handleScanSuccess}
      />

    </>
  );
}
