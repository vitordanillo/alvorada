'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import type { Customer } from '@/lib/types';

interface CustomerSelectionDialogProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerSelectionDialog({ customers, onSelectCustomer, open, onOpenChange }: CustomerSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );
  
  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    onOpenChange(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Cliente</DialogTitle>
          <DialogDescription>Busque pelo nome ou telefone para associar um cliente à venda.</DialogDescription>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar cliente..." 
                className="pl-10" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <ScrollArea className="h-72">
            <div className="space-y-2 pr-4">
                {filteredCustomers.map(customer => (
                    <div 
                        key={customer.id} 
                        className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleSelect(customer)}
                    >
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${customer.name.charAt(0)}`} alt="Avatar" data-ai-hint="person avatar" />
                            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
