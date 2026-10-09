
'use client';

import {CashEvidence} from '@/components/cash-register/cash-evidence';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, LogIn, LogOut, History, ArrowDown, ArrowUp, Receipt, Edit, Undo2, PiggyBank, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionDialog } from '@/components/cash-register/transaction-dialog';
import { Separator } from '@/components/ui/separator';
import type { CashRegisterSession, CashTransaction } from '@/lib/types';

const openSchema = z.object({
  openingBalance: z.coerce.number().min(0, 'O valor inicial deve ser positivo.'),
});

const closeSchema = z.object({
  cardCount:z.coerce.number().min(0),
  pixCount:z.coerce.number().min(0),
  closingBalance: z.coerce.number().min(0, 'O valor final deve ser positivo.'),
});

const correctionSchema = z.object({
  reason:z.string().trim().min(5),
  newClosingBalance: z.coerce.number().min(0, 'O valor deve ser positivo.'),
});

const openCorrectionSchema = z.object({
  reason:z.string().trim().min(5),
  newOpeningBalance: z.coerce.number().min(0, 'O valor inicial deve ser positivo.'),
});


export default function CashRegisterPage() {
  const { 
    user, activeSession, 
    cashSessions,
    cashTransactions,
    loading, 
    openCashRegister, 
    closeCashRegister,
    correctCashClosing,
    correctOpeningBalance,
    reopenCashRegister,
    cancelCashRegisterOpening,
    addCashTransaction,
  } = useAppContext();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  const [isOpeningConfirmationOpen, setIsOpeningConfirmationOpen] = useState(false);
  const [openingBalanceToConfirm, setOpeningBalanceToConfirm] = useState(0);
  
  const [isCorrectionOpenDialogOpen, setIsCorrectionOpenDialogOpen] = useState(false);
  const [isSubmittingOpenCorrection, setIsSubmittingOpenCorrection] = useState(false);
  
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [sessionToCorrect, setSessionToCorrect] = useState<CashRegisterSession | null>(null);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [sessionToReopen, setSessionToReopen] = useState<CashRegisterSession | null>(null);
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);


  const openForm = useForm({
    resolver: zodResolver(openSchema),
    defaultValues: { openingBalance: 0 },
  });

  const closeForm = useForm({
    resolver: zodResolver(closeSchema),
    defaultValues: { closingBalance: 0,cardCount:0,pixCount:0 },
  });

  const correctionForm = useForm({
    resolver: zodResolver(correctionSchema),
    defaultValues: { newClosingBalance: 0,reason:'' },
  });

  const openCorrectionForm = useForm({
    resolver: zodResolver(openCorrectionSchema),
    defaultValues: { newOpeningBalance: 0,reason:'' },
  });


  const watchedClosingBalance = closeForm.watch('closingBalance');
  const difference = activeSession ? Number(watchedClosingBalance) - activeSession.calculatedCashInDrawer : 0;
  
  const watchedNewClosingBalance = correctionForm.watch('newClosingBalance');
  const correctionDifference = sessionToCorrect ? Number(watchedNewClosingBalance) - sessionToCorrect.calculatedCashInDrawer : 0;


  useEffect(() => {
    setIsClient(true);
  }, []);

  const onOpenSubmit = (data: z.infer<typeof openSchema>) => {
    setOpeningBalanceToConfirm(data.openingBalance);
    setIsOpenDialogOpen(false);
    setIsOpeningConfirmationOpen(true);
  };

  const handleOpenRegister = async () => {
    setIsOpening(true);
    setIsOpeningConfirmationOpen(false);
    try {
      await openCashRegister(openingBalanceToConfirm);
      toast({ title: "Sucesso!", description: "Caixa aberto com sucesso." });
      openForm.reset();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível abrir o caixa." });
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseRegister = async (data: z.infer<typeof closeSchema>) => {
    setIsClosing(true);
    try {
      await closeCashRegister(data.closingBalance,{Cartão:data.cardCount,Pix:data.pixCount});
      toast({ title: "Sucesso!", description: "Caixa fechado com sucesso." });
      closeForm.reset();
      setIsCloseDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível fechar o caixa." });
    } finally {
      setIsClosing(false);
    }
  };

  const handleCorrectOpening = async (data: z.infer<typeof openCorrectionSchema>) => {
    if (!activeSession) return;
    setIsSubmittingOpenCorrection(true);
    try {
        await correctOpeningBalance(data.newOpeningBalance,data.reason);
        toast({ title: "Sucesso!", description: "Valor de abertura corrigido." });
        setIsCorrectionOpenDialogOpen(false);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível corrigir o valor de abertura." });
    } finally {
        setIsSubmittingOpenCorrection(false);
    }
  };

  const handleOpenCorrectionDialog = (session: CashRegisterSession) => {
    setSessionToCorrect(session);
    correctionForm.setValue('newClosingBalance', session.closingBalance || 0);
    setIsCorrectionDialogOpen(true);
  };

  const handleCorrectClosing = async (data: z.infer<typeof correctionSchema>) => {
      if (!sessionToCorrect) return;
      setIsSubmittingCorrection(true);
      try {
          await correctCashClosing(sessionToCorrect.id, data.newClosingBalance,data.reason);
          toast({ title: "Sucesso!", description: "Fechamento de caixa corrigido." });
          setIsCorrectionDialogOpen(false);
          setSessionToCorrect(null);
      } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "Erro!", description: "Não foi possível corrigir o fechamento." });
      } finally {
          setIsSubmittingCorrection(false);
      }
  };

  const handleOpenReopenDialog = (session: CashRegisterSession) => {
    setSessionToReopen(session);
    setIsReopenDialogOpen(true);
  };

  const handleReopenSession = async () => {
    if (!sessionToReopen) return;
    setIsSubmittingReopen(true);
    try {
      await reopenCashRegister(sessionToReopen.id);
      toast({ title: 'Sucesso!', description: 'O caixa foi reaberto e está ativo novamente.' });
      setIsReopenDialogOpen(false);
      setSessionToReopen(null);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível reabrir o caixa.";
      toast({ variant: 'destructive', title: 'Erro!', description: errorMessage });
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const handleCancelOpening = async () => {
    if (!activeSession) return;
    setIsCancelling(true);
    try {
      await cancelCashRegisterOpening(activeSession.id);
      toast({ title: "Sucesso!", description: "Abertura de caixa cancelada." });
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível cancelar a abertura.";
      toast({ variant: "destructive", title: "Erro!", description: errorMessage });
    } finally {
      setIsCancelling(false);
    }
  };


  const handleAddTransaction = async (type: 'Despesa' | 'Sangria', data: { amount: number; description: string }) => {
    try {
      await addCashTransaction({ type, ...data });
      toast({ title: 'Sucesso!', description: `${type} registrada com sucesso.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro!", description: `Não foi possível registrar a ${type.toLowerCase()}.` });
    }
  };
  
  const getTransactionStyle = (type: CashTransaction['type']) => {
    switch (type) {
        case 'Despesa': return { text: 'text-red-600', sign: '-' };
        case 'Sangria': return { text: 'text-yellow-600', sign: '-' };
        case 'Recebimento Fiado': return { text: 'text-green-600', sign: '+' };
        default: return { text: '', sign: '' };
    }
  }

  if (!isClient || loading.cashSessions) {
    return <Skeleton className="h-[400px] w-full" />;
  }
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Caixa"
        description="Abra, feche e acompanhe o fluxo de caixa do dia."
      />

      {activeSession ? (
        <>
          <Card className="rounded-2xl border-none shadow-sm bg-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                  <div>
                      <CardTitle className="text-green-600">Caixa Aberto</CardTitle>
                      <CardDescription>
                        Aberto por {activeSession.openedBy.name} em{' '}
                        {format(new Date(activeSession.openingTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {activeSession.openingCorrection && (
                          <span className="text-blue-600 block text-xs"> (Valor inicial corrigido)</span>
                        )}
                      </CardDescription>
                  </div>
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                          if (activeSession) {
                              openCorrectionForm.setValue('newOpeningBalance', activeSession.openingBalance);
                              setIsCorrectionOpenDialogOpen(true);
                          }
                      }}>
                          <Edit className="mr-2 h-3 w-3" /> Corrigir Abertura
                      </Button>
                      <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setIsCancelDialogOpen(true)}
                          disabled={
                              activeSession.totalSales > 0 || 
                              activeSession.totalExpenses > 0 || 
                              activeSession.totalWithdrawals > 0 ||
                              activeSession.totalCreditPayments > 0
                          }
                          >
                          <Trash2 className="mr-2 h-3 w-3" /> Cancelar Abertura
                      </Button>
                   </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Fluxo do Dinheiro Físico (Gaveta)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Fundo de Troco</p>
                      <p className="text-2xl font-bold font-headline">R$ {activeSession.openingBalance.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Vendas em Dinheiro</p>
                      <p className="text-2xl font-bold font-headline">R$ {activeSession.salesByPaymentMethod.Dinheiro.toFixed(2).replace('.', ',')}</p>
                  </div>
                   <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><PiggyBank className="text-green-500 h-4 w-4"/> Recebimentos</p>
                      <p className="text-2xl font-bold font-headline text-green-500">+ R$ {(activeSession.totalCreditPayments ?? 0).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="bg-primary/20 p-4 rounded-lg border border-primary">
                      <p className="text-sm text-primary/80">Saldo em Gaveta (Calculado)</p>
                      <p className="text-2xl font-bold font-headline text-primary">R$ {activeSession.calculatedCashInDrawer.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Movimentações e Totais da Sessão</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Vendas em Cartão</p>
                        <p className="text-2xl font-bold font-headline">R$ {activeSession.salesByPaymentMethod.Cartão.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Vendas em Pix</p>
                        <p className="text-2xl font-bold font-headline">R$ {activeSession.salesByPaymentMethod.Pix.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowDown className="text-red-500 h-4 w-4"/> Despesas</p>
                        <p className="text-2xl font-bold font-headline text-red-500">- R$ {(activeSession.totalExpenses ?? 0).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowUp className="text-yellow-500 h-4 w-4"/> Sangrias</p>
                        <p className="text-2xl font-bold font-headline text-yellow-500">- R$ {(activeSession.totalWithdrawals ?? 0).toFixed(2).replace('.', ',')}</p>
                    </div>
                     <div className="bg-muted p-4 rounded-lg col-span-1 sm:col-span-2 md:col-span-4">
                        <p className="text-sm text-muted-foreground">Faturamento Total da Sessão (Vendas)</p>
                        <p className="text-2xl font-bold font-headline">R$ {activeSession.totalSales.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full justify-between items-center">
                  <div className="flex gap-2">
                      <TransactionDialog type="Despesa" onSubmit={(data) => handleAddTransaction('Despesa', data)}>
                          <Button variant="outline" className="rounded-full">
                              <ArrowDown className="mr-2 h-4 w-4" /> Registrar Despesa
                          </Button>
                      </TransactionDialog>
                      <TransactionDialog type="Sangria" onSubmit={(data) => handleAddTransaction('Sangria', data)}>
                          <Button variant="outline" className="rounded-full">
                              <ArrowUp className="mr-2 h-4 w-4" /> Registrar Sangria
                          </Button>
                      </TransactionDialog>
                  </div>
                  
                  <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                      <DialogTrigger asChild>
                          <Button variant="destructive" size="lg" className="rounded-full">
                              <LogOut className="mr-2 h-4 w-4" />
                              Fechar Caixa
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Confirmar Fechamento de Caixa</DialogTitle>
                              <DialogDescription>
                                  Realize a contagem do dinheiro na gaveta e insira o valor total para fechar o caixa.
                              </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={closeForm.handleSubmit(handleCloseRegister)} className="space-y-4"><label className="block">Cartão informado (R$)<Input type="number" min="0" step="0.01" {...closeForm.register("cardCount")}/></label><label className="block">Pix informado (R$)<Input type="number" min="0" step="0.01" {...closeForm.register("pixCount")}/></label><p className="text-sm">Cartão esperado: R$ {(activeSession?.salesByPaymentMethod?.["Cartão"]??0).toFixed(2)} · diferença R$ {(Number(closeForm.watch("cardCount"))-(activeSession?.salesByPaymentMethod?.["Cartão"]??0)).toFixed(2)}. Pix esperado: R$ {(activeSession?.salesByPaymentMethod?.Pix??0).toFixed(2)} · diferença R$ {(Number(closeForm.watch("pixCount"))-(activeSession?.salesByPaymentMethod?.Pix??0)).toFixed(2)}.</p>
                               <div className="space-y-3 rounded-md border bg-muted/50 p-4">
                                  <div className="flex justify-between font-medium">
                                      <span className="text-muted-foreground">Valor Esperado (Sistema):</span>
                                      <span>R$ {activeSession.calculatedCashInDrawer.toFixed(2).replace('.', ',')}</span>
                                  </div>
                                  <div className="flex justify-between font-medium">
                                      <span className="text-muted-foreground">Valor Contado (Gaveta):</span>
                                      <span>R$ {Number(watchedClosingBalance || 0).toFixed(2).replace('.', ',')}</span>
                                  </div>
                                  <Separator/>
                                  <div className="flex justify-between font-bold text-lg">
                                      <span>Diferença:</span>
                                      <span className={difference === 0 ? '' : difference > 0 ? 'text-green-600' : 'text-red-600'}>
                                          R$ {difference.toFixed(2).replace('.', ',')} ({difference === 0 ? 'Correto' : difference > 0 ? 'Sobra' : 'Falta'})
                                      </span>
                                  </div>
                              </div>

                              <div className="space-y-2">
                                  <Label htmlFor="closingBalance">Insira o Valor Contado em Gaveta (R$)</Label>
                                  <Input
                                      id="closingBalance"
                                      type="number"
                                      step="0.01"
                                      placeholder="Ex: 550.75"
                                      {...closeForm.register('closingBalance')}
                                  />
                                   {closeForm.formState.errors.closingBalance && <p className="text-sm text-destructive">{closeForm.formState.errors.closingBalance.message}</p>}
                              </div>
                              <DialogFooter>
                                  <Button type="submit" variant="destructive" disabled={isClosing}>
                                      {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Confirmar Fechamento
                                  </Button>
                              </DialogFooter>
                          </form>
                      </DialogContent>
                  </Dialog>
              </div>
            </CardFooter>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Receipt /> Movimentações do Caixa Atual</CardTitle>
              <CardDescription>Visualize as despesas e sangrias do caixa aberto.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.cashTransactions ? (
                  <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin"/></div>
              ) : cashTransactions.length > 0 ? (
                  <div className="space-y-4">
                      {cashTransactions.map(tx => {
                          const style = getTransactionStyle(tx.type);
                          return (
                            <div key={tx.id} className="flex items-center">
                                <div>
                                    <p className="font-medium">{tx.description}</p>{tx.customerId&&<a className="text-xs underline" href={'/dashboard/customers/'+tx.customerId}>Extrato do cliente</a>}{tx.description.match(/Pagamento de conta #([a-f0-9-]{36})/)&&<a className="text-xs underline" href={'/dashboard/accounts-payable?search='+tx.description.match(/Pagamento de conta #([a-f0-9-]{36})/)?.[1]}>Conta vinculada</a>}
                                    <p className="text-sm text-muted-foreground">
                                        {tx.type} por {tx.registeredBy.name} em {format(new Date(tx.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                                <div className={`ml-auto font-semibold ${style.text}`}>
                                    {style.sign} R$ {tx.amount.toFixed(2).replace('.', ',')}
                                </div>
                            </div>
                          )
                      })}
                  </div>
              ) : (
                  <p className="text-muted-foreground text-center py-4">Nenhuma movimentação registrada neste caixa.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-2xl border-dashed shadow-sm bg-card">
          <CardContent className="p-6 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-bold tracking-tight">Caixa Fechado</h3>
            <p className="text-muted-foreground mb-4">
              Para começar a vender, você precisa abrir o caixa.
            </p>
             <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" className="rounded-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Abrir Caixa
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Abrir Caixa</DialogTitle>
                        <DialogDescription>
                            Insira o valor inicial do fundo de troco para abrir o caixa.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={openForm.handleSubmit(onOpenSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="openingBalance">Fundo de Troco (R$)</Label>
                            <Input
                                id="openingBalance"
                                type="number"
                                step="0.01"
                                placeholder="Ex: 200.00"
                                {...openForm.register('openingBalance')}
                            />
                            {openForm.formState.errors.openingBalance && <p className="text-sm text-destructive">{openForm.formState.errors.openingBalance.message}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isOpening}>
                                {isOpening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Abrir Caixa Agora
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
             </Dialog>
          </CardContent>
        </Card>
      )}

       <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History /> Histórico de Caixas Fechados</CardTitle>
            <CardDescription>Visualize as sessões de caixa anteriores.</CardDescription>
          </CardHeader>
          <CardContent>
            {cashSessions.filter(s => s.status === 'Fechado').length > 0 ? (
                <div className="space-y-4">
                    {cashSessions.filter(s => s.status === 'Fechado').map(session => {
                      const difference = (session.closingBalance ?? 0) - session.calculatedCashInDrawer;
                      return (
                          <div key={session.id} className="border p-4 rounded-lg space-y-2">
                               <div className="flex justify-between items-start">
                                    <div>
                                        <p><strong>Data:</strong> {format(new Date(session.openingTime), "dd/MM/yyyy", { locale: ptBR })}</p>
                                        <p className='text-sm text-muted-foreground'>
                                          Aberto às {format(new Date(session.openingTime), "HH:mm", { locale: ptBR })} por <strong>{session.openedBy.name}</strong>
                                        </p>
                                        {session.closingTime && session.closedBy && (
                                          <p className='text-sm text-muted-foreground'>
                                            Fechado às {format(new Date(session.closingTime), "HH:mm", { locale: ptBR })} por <strong>{session.closedBy.name}</strong>
                                          </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button disabled={!['Administrador','Gerente'].includes(user?.role??'')} variant="outline" size="sm" onClick={() => handleOpenCorrectionDialog(session)}>
                                        <Edit className="mr-2 h-3 w-3" /> Corrigir
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleOpenReopenDialog(session)} disabled={!!activeSession}>
                                        <Undo2 className="mr-2 h-3 w-3" /> Reabrir
                                      </Button>
                                    </div>
                               </div>
                               <CashEvidence session={session}/><Separator />
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <p><strong>Valor Esperado:</strong> R$ {session.calculatedCashInDrawer.toFixed(2).replace('.', ',')}</p>
                                  <p><strong>Valor Fechado:</strong> R$ {(session.closingBalance ?? 0).toFixed(2).replace('.', ',')}</p>
                                  <p><strong>Diferença:</strong> 
                                  <span className={`font-bold ${difference === 0 ? '' : difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    R$ {difference.toFixed(2).replace('.', ',')} ({difference === 0 ? 'Correto' : difference > 0 ? 'Sobra' : 'Falta'})
                                  </span>
                                  </p>
                                  {session.correction && (
                                    <p className="text-blue-600">
                                      Corrigido por <strong>{session.correction.user.name}</strong> em {format(new Date(session.correction.date), "dd/MM", { locale: ptBR })}
                                    </p>
                                  )}
                               </div>
                          </div>
                      )
                    })}
                </div>
            ): (
                <p className="text-muted-foreground text-center">Nenhum caixa fechado encontrado.</p>
            )}
          </CardContent>
       </Card>

      <AlertDialog open={isOpeningConfirmationOpen} onOpenChange={setIsOpeningConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Abertura do Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              O caixa será aberto com um fundo de troco de <strong>R$ {openingBalanceToConfirm.toFixed(2).replace('.', ',')}</strong>.
              <br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsOpeningConfirmationOpen(false);
              setIsOpenDialogOpen(true);
            }} disabled={isOpening}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpenRegister} disabled={isOpening}>
              {isOpening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, Abrir Caixa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCorrectionOpenDialogOpen} onOpenChange={setIsCorrectionOpenDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Corrigir Valor de Abertura</DialogTitle>
                <DialogDescription>
                  Ajuste o valor inicial de abertura do caixa. O saldo atual será recalculado automaticamente.
                </DialogDescription>
            </DialogHeader>
            {activeSession && (
              <form onSubmit={openCorrectionForm.handleSubmit(handleCorrectOpening)} className="space-y-4"><label className="block">Motivo da correção<Input minLength={5} maxLength={500} required {...openCorrectionForm.register("reason")}/></label>
                    <div className="space-y-3 rounded-md border bg-muted/50 p-4">
                        <div className="flex justify-between font-medium">
                            <span className="text-muted-foreground">Valor de Abertura Atual:</span>
                            <span>R$ {activeSession.openingBalance.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newOpeningBalance">Novo Valor de Abertura (R$)</Label>
                        <Input
                            id="newOpeningBalance"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 200.00"
                            {...openCorrectionForm.register('newOpeningBalance')}
                        />
                        {openCorrectionForm.formState.errors.newOpeningBalance && <p className="text-sm text-destructive">{openCorrectionForm.formState.errors.newOpeningBalance.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmittingOpenCorrection}>
                            {isSubmittingOpenCorrection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Correção
                        </Button>
                    </DialogFooter>
              </form>
            )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCorrectionDialogOpen} onOpenChange={setIsCorrectionDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Corrigir Fechamento de Caixa</DialogTitle>
                <DialogDescription>
                  Corrija o valor final do caixa para a sessão de {sessionToCorrect ? format(new Date(sessionToCorrect.openingTime), "dd/MM/yyyy", { locale: ptBR }) : ''}.
                </DialogDescription>
            </DialogHeader>
            {sessionToCorrect && (
              <form onSubmit={correctionForm.handleSubmit(handleCorrectClosing)} className="space-y-4"><label className="block">Motivo da correção<Input minLength={5} maxLength={500} required {...correctionForm.register("reason")}/></label>
                    <div className="space-y-3 rounded-md border bg-muted/50 p-4">
                        <div className="flex justify-between font-medium">
                            <span className="text-muted-foreground">Valor Esperado (Sistema):</span>
                            <span>R$ {sessionToCorrect.calculatedCashInDrawer.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                            <span className="text-muted-foreground">Novo Valor Contado:</span>
                            <span>R$ {Number(watchedNewClosingBalance || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <Separator/>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Nova Diferença:</span>
                            <span className={correctionDifference === 0 ? '' : correctionDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                                R$ {correctionDifference.toFixed(2).replace('.', ',')} ({correctionDifference === 0 ? 'Correto' : correctionDifference > 0 ? 'Sobra' : 'Falta'})
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newClosingBalance">Insira o Novo Valor Contado (R$)</Label>
                        <Input
                            id="newClosingBalance"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 550.75"
                            {...correctionForm.register('newClosingBalance')}
                        />
                        {correctionForm.formState.errors.newClosingBalance && <p className="text-sm text-destructive">{correctionForm.formState.errors.newClosingBalance.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmittingCorrection}>
                            {isSubmittingCorrection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Correção
                        </Button>
                    </DialogFooter>
              </form>
            )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reabertura do Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação reabrirá o caixa da data de {sessionToReopen ? format(new Date(sessionToReopen.openingTime), "dd/MM/yyyy", { locale: ptBR }) : ''}. 
              A sessão voltará a ser a ativa e você poderá registrar novas vendas ou movimentações. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingReopen}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopenSession} disabled={isSubmittingReopen}>
              {isSubmittingReopen && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, Reabrir Caixa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento da Abertura</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente a sessão de caixa atual. Isso só é possível porque nenhuma movimentação foi registrada. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOpening} disabled={isCancelling} className="bg-destructive hover:bg-destructive/90">
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, Cancelar Abertura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
