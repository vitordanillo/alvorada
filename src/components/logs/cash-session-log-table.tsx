
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CashRegisterSession } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Edit, FilePen, LogIn, LogOut, Undo2 } from 'lucide-react';

interface CashSessionLogTableProps {
  logs: CashRegisterSession[];
}

export function CashSessionLogTable({ logs }: CashSessionLogTableProps) {
    if (logs.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Nenhuma sessão de caixa registrada para os filtros selecionados.</p>;
    }

    const getEventDescription = (log: CashRegisterSession) => {
        const events = [];

        // Opening event
        events.push({
            date: log.openingTime,
            description: `Abertura com fundo de troco de R$ ${log.openingBalance.toFixed(2).replace('.', ',')}`,
            user: log.openedBy.name,
            icon: <LogIn className="h-4 w-4 text-green-600" />
        });

        // Opening correction event
        if (log.openingCorrection) {
            events.push({
                date: log.openingCorrection.date,
                description: `Abertura corrigida de R$ ${log.openingCorrection.oldValue.toFixed(2).replace('.',',')} para R$ ${log.openingCorrection.newValue.toFixed(2).replace('.',',')}`,
                user: log.openingCorrection.user.name,
                icon: <Edit className="h-4 w-4 text-blue-600" />
            });
        }
        
        // Closing event
        if (log.closingTime && log.closedBy && log.status === 'Fechado') {
             const difference = (log.closingBalance ?? 0) - log.calculatedCashInDrawer;
             const diffText = difference === 0 ? 'correto' : `com ${difference > 0 ? 'sobra' : 'falta'} de R$ ${Math.abs(difference).toFixed(2).replace('.', ',')}`;

            events.push({
                date: log.closingTime,
                description: `Fechamento com valor de R$ ${(log.closingBalance ?? 0).toFixed(2).replace('.', ',')} (${diffText})`,
                user: log.closedBy.name,
                icon: <LogOut className="h-4 w-4 text-red-600" />
            });
        }

        // Closing correction event
        if (log.correction) {
            events.push({
                date: log.correction.date,
                description: `Fechamento corrigido de R$ ${log.correction.oldValue.toFixed(2).replace('.',',')} para R$ ${log.correction.newValue.toFixed(2).replace('.',',')}`,
                user: log.correction.user.name,
                icon: <FilePen className="h-4 w-4 text-blue-600" />
            });
        }
        
        // Re-opening event
        // This is a simplification; a more robust system would track each reopen event.
        // Here we assume if it's open but has a closingTime, it was reopened.
        if(log.status === 'Aberto' && log.closingTime) {
             events.push({
                date: log.closingTime, // Placeholder, ideally we'd store reopen time
                description: 'Caixa foi reaberto.',
                user: log.closedBy?.name || 'Sistema', // Placeholder
                icon: <Undo2 className="h-4 w-4 text-orange-500" />
            });
        }

        return events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data e Hora</TableHead>
          <TableHead>Sessão ID</TableHead>
          <TableHead>Evento</TableHead>
          <TableHead>Usuário</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.flatMap(log => 
            getEventDescription(log).map((event, index) => (
              <TableRow key={`${log.id}-${index}`}>
                <TableCell>{format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                <TableCell className="font-mono text-xs">{log.id}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        {event.icon}
                        <span>{event.description}</span>
                    </div>
                </TableCell>
                <TableCell>{event.user}</TableCell>
              </TableRow>
            ))
        )}
      </TableBody>
    </Table>
  );
}
