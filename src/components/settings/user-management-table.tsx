'use client';

import * as React from 'react';
import { useAuth } from '@/context/app-context';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserManagementTableProps {
  users: User[];
  onUpdateRole: (uid: string, role: User['role'], reason:string) => Promise<void>;
  onCreateUser: (name: string, email: string, password: string, role: User['role']) => Promise<void>;
}

export function UserManagementTable({ users, onUpdateRole, onCreateUser }: UserManagementTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<User['role']>('Operador de Caixa');
  const [reason,setReason]=React.useState(''),[updating,setUpdating]=React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const handleRoleChange = async (uid: string, newRole: User['role']) => {
    if(updating)return;setUpdating(true);
    try {
      if(reason.trim().length<5)throw new Error('Informe o motivo antes de alterar o cargo.');
      await onUpdateRole(uid, newRole,reason);
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
    }finally{setUpdating(false);}
  };

  const roles: User['role'][] = ['Administrador', 'Gerente', 'Operador de Caixa', 'Estoquista'];

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    try {
      await onCreateUser(name, email, password, role);
      setName('');
      setEmail('');
      setPassword('');
      toast({ title: 'Usuário criado', description: 'A conta foi adicionada à loja.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível criar o usuário.';
      toast({ variant: 'destructive', title: 'Erro ao criar usuário', description: message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>Altere as permissões de acesso de cada usuário do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="mb-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Nome</Label>
            <Input id="new-user-name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">E-mail</Label>
            <Input id="new-user-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-password">Senha inicial (mínimo 12 caracteres)</Label>
            <Input id="new-user-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Permissão</Label>
            <Select value={role} onValueChange={(value: User['role']) => setRole(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.filter((value) => value !== 'Administrador').map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating}>{creating ? 'Criando…' : 'Adicionar usuário'}</Button>
          </div>
        </form>
        <label className="mb-4 block">Motivo para alteração de cargo<Input value={reason} minLength={5} maxLength={500} onChange={e=>setReason(e.target.value)}/></label><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-[220px]">Permissão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.uid || user.email || `cached-user-${index}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png`} alt="Avatar" data-ai-hint="person avatar" />
                      <AvatarFallback>{user.name?.trim().charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{user.name || user.email || 'Usuário'}</div>
                  </div>
                </TableCell>
                <TableCell>{user.email}<p className="text-xs text-muted-foreground">{user.disabled?"Conta bloqueada":"Conta habilitada"} · revisão de sessões {user.sessionVersion??0}{user.mustChangePassword?" · Senha temporária":""}</p></TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(newRole: User['role']) => handleRoleChange(user.uid, newRole)}
                    disabled={updating||!user.uid || user.uid === currentUser?.uid}
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
