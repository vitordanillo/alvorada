'use client';

import * as React from 'react';
import { useAuth } from '@/context/app-context';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface UserManagementTableProps {
  users: User[];
  onUpdateRole: (uid: string, role: User['role']) => Promise<void>;
}

export function UserManagementTable({ users, onUpdateRole }: UserManagementTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const handleRoleChange = async (uid: string, newRole: User['role']) => {
    try {
      await onUpdateRole(uid, newRole);
      toast({
        title: "Função atualizada!",
        description: `A função do usuário foi alterada para ${newRole}.`
      });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível alterar a função do usuário.';
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: errorMessage
      });
    }
  };

  const roles: User['role'][] = ['Administrador', 'Gerente', 'Operador de Caixa', 'Estoquista'];

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>Altere as permissões de acesso de cada usuário do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-[220px]">Permissão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png`} alt="Avatar" data-ai-hint="person avatar" />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{user.name}</div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(newRole: User['role']) => handleRoleChange(user.uid, newRole)}
                    disabled={user.uid === currentUser?.uid}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma permissão" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user.uid === currentUser?.uid && (
                     <p className="text-xs text-muted-foreground mt-1">Você não pode alterar sua própria permissão.</p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
