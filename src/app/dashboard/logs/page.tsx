

'use client';

import * as React from 'react';
import { PageHeader } from "@/components/page-header";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockAdjustmentLogTable } from '@/components/logs/stock-adjustment-log-table';
import { SalesLogTable } from '@/components/logs/sales-log-table';
import { CashSessionLogTable } from '@/components/logs/cash-session-log-table';
import { CashTransactionLogTable } from '@/components/logs/cash-transaction-log-table';
import { ProductChangeLogTable } from '@/components/logs/product-change-log-table';
import { StockEntryLogTable } from '@/components/logs/stock-entry-log-table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay } from 'date-fns';
import { AccountsPayableLogTable } from '@/components/logs/accounts-payable-log-table';
import { PurchaseOrderLogTable } from '@/components/logs/purchase-order-log-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';


export default function LogsPage() {
  const { 
    stockAdjustmentLogs, 
    sales,
    cashSessions,
    cashTransactions,
    stockEntryLogs,
    productChangeLogs,
    accountsPayable,
    purchaseOrders,
    loading, 
    user,
    allUsers
  } = useAppContext();
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return { from, to };
  });
  const [selectedUserId, setSelectedUserId] = React.useState<string>('all');
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = React.useState(true);

  React.useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoadingAudit(true);
        const { getAuditLogsAction } = await import('@/lib/db-actions');
        const fetched = await getAuditLogsAction(user?.storeId);
        setAuditLogs(fetched);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoadingAudit(false);
      }
    };
    if (user?.role === 'Administrador') {
      fetchAuditLogs();
    }
  }, [user]);

  if (user?.role !== 'Administrador') {
     return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Acesso Negado"
                description="Você não tem permissão para acessar esta página."
            />
            <Card className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm bg-card h-[450px]">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Apenas Administradores
                    </h3>
                    <p className="text-sm text-muted-foreground">
                       Esta página só pode ser acessada por usuários com permissão de Administrador.
                    </p>
                </div>
            </Card>
        </div>
     )
  }

  const isLoading = loading.stockAdjustmentLogs || loading.sales || loading.cashSessions || loading.cashTransactions || loading.stockEntryLogs || loading.productChangeLogs || loading.accountsPayable || loading.purchaseOrders || loadingAudit;

  const filterByDateAndUser = (logs: any[], userFieldPath: string | string[], dateField: string = 'date') => {
    return logs.filter(log => {
      const logDate = new Date(log[dateField]);
      const from = dateRange?.from ? startOfDay(dateRange.from) : null;
      const to = dateRange?.to ? endOfDay(dateRange.to) : null;

      const dateMatch = (!from || logDate >= from) && (!to || logDate <= to);
      if (!dateMatch) return false;

      if (selectedUserId === 'all') return true;
      
      let logUserId: string;
      if (Array.isArray(userFieldPath)) {
        logUserId = userFieldPath.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, log);
      } else {
        logUserId = log[userFieldPath]?.uid;
      }
      
      return logUserId === selectedUserId;
    });
  }
  
  const filteredSales = filterByDateAndUser(sales, 'cancelledBy');
  const filteredAdjLogs = filterByDateAndUser(stockAdjustmentLogs, 'adjustedBy');
  const filteredCashTransactions = filterByDateAndUser(cashTransactions, 'registeredBy');
  const filteredStockEntries = filterByDateAndUser(stockEntryLogs, 'registeredBy');
  const filteredProductChanges = filterByDateAndUser(productChangeLogs, 'changedBy');
  const filteredPayables = filterByDateAndUser(accountsPayable, 'registeredBy', 'dateCreated');
  const filteredPurchaseOrders = filterByDateAndUser(purchaseOrders, 'registeredBy', 'dateCreated');
  
  const filteredAuditLogs = auditLogs.filter(log => {
    const logDate = new Date(log.date);
    const from = dateRange?.from ? startOfDay(dateRange.from) : null;
    const to = dateRange?.to ? endOfDay(dateRange.to) : null;

    const dateMatch = (!from || logDate >= from) && (!to || logDate <= to);
    if (!dateMatch) return false;

    if (selectedUserId === 'all') return true;
    return log.userUid === selectedUserId;
  });

  // Cash sessions have multiple user fields, so we filter differently
   const filteredCashSessions = cashSessions.filter(log => {
      const logDate = new Date(log.openingTime);
      const from = dateRange?.from ? startOfDay(dateRange.from) : null;
      const to = dateRange?.to ? endOfDay(dateRange.to) : null;

      const dateMatch = (!from || logDate >= from) && (!to || logDate <= to);
      if (!dateMatch) return false;

      if (selectedUserId === 'all') return true;

      return log.openedBy.uid === selectedUserId ||
             log.closedBy?.uid === selectedUserId ||
             log.correction?.user.uid === selectedUserId ||
             log.openingCorrection?.user.uid === selectedUserId;
  });


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Logs do Sistema"
        description="Audite todas as atividades críticas registradas no sistema."
      />

       <Card className="rounded-2xl border-none shadow-sm bg-card">
         <CardHeader>
           <CardTitle>Filtros</CardTitle>
           <CardDescription>Filtre os logs por período ou por usuário para uma análise mais detalhada.</CardDescription>
         </CardHeader>
         <CardContent className="flex flex-col sm:flex-row gap-4">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                {allUsers.map(u => (
                  <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
         </CardContent>
       </Card>

      {isLoading ? (
        <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
         </Card>
      ) : (
        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="audit-logs">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap h-auto">
                    <TabsTrigger value="audit-logs">Logs de Auditoria</TabsTrigger>
                    <TabsTrigger value="stock-adjustments">Ajustes Estoque</TabsTrigger>
                    <TabsTrigger value="stock-entries">Entradas Estoque</TabsTrigger>
                    <TabsTrigger value="product-changes">Alterações Produtos</TabsTrigger>
                    <TabsTrigger value="purchase-orders">Pedidos de Compra</TabsTrigger>
                    <TabsTrigger value="sales">Vendas</TabsTrigger>
                    <TabsTrigger value="cash-sessions">Sessões de Caixa</TabsTrigger>
                    <TabsTrigger value="cash-transactions">Mov. de Caixa</TabsTrigger>
                    <TabsTrigger value="accounts-payable">Contas a Pagar</TabsTrigger>
                </TabsList>
                <TabsContent value="audit-logs" className="mt-4">
                  <AuditLogTable logs={filteredAuditLogs} />
                </TabsContent>
                <TabsContent value="stock-adjustments" className="mt-4">
                  <StockAdjustmentLogTable logs={filteredAdjLogs} />
                </TabsContent>
                 <TabsContent value="stock-entries" className="mt-4">
                  <StockEntryLogTable logs={filteredStockEntries} />
                </TabsContent>
                <TabsContent value="product-changes" className="mt-4">
                  <ProductChangeLogTable logs={filteredProductChanges} />
                </TabsContent>
                <TabsContent value="purchase-orders" className="mt-4">
                  <PurchaseOrderLogTable logs={filteredPurchaseOrders} />
                </TabsContent>
                <TabsContent value="sales" className="mt-4">
                  <SalesLogTable logs={filteredSales} />
                </TabsContent>
                <TabsContent value="cash-sessions" className="mt-4">
                  <CashSessionLogTable logs={filteredCashSessions} />
                </TabsContent>
                <TabsContent value="cash-transactions" className="mt-4">
                  <CashTransactionLogTable logs={filteredCashTransactions} />
                </TabsContent>
                 <TabsContent value="accounts-payable" className="mt-4">
                  <AccountsPayableLogTable logs={filteredPayables} />
                </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Local helper component to show audit logs beautifully
import { Calendar, Info, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function AuditLogTable({ logs }: { logs: any[] }) {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Abertura de Caixa':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">Abertura de Caixa</Badge>;
      case 'Fechamento de Caixa':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">Fechamento de Caixa</Badge>;
      case 'Correção de Saldo de Fechamento':
      case 'Correção de Saldo de Abertura':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80">Ajuste de Saldo</Badge>;
      case 'Cancelamento de Venda':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100/80">Cancelamento</Badge>;
      case 'Reabertura de Caixa':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/80">Reabertura</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="rounded-md border mt-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Data / Hora</TableHead>
            <TableHead className="w-[180px]">Ação</TableHead>
            <TableHead>Detalhes</TableHead>
            <TableHead className="w-[180px]">Usuário</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Nenhum log de auditoria encontrado para os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(log.date).toLocaleString('pt-BR')}
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell className="text-sm font-medium">
                  <div className="flex items-start gap-1.5 max-w-md md:max-w-xl">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{log.details}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>{log.userName}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
