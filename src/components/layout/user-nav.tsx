
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logout realizado com sucesso!',
      });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível fazer logout. Tente novamente.',
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Abrir menu da conta" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatarUrl} alt="Foto do perfil" />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          {(user?.isPlatformAdmin || user?.role==='Administrador') && <DropdownMenuItem asChild>
            <Link href={user?.isPlatformAdmin?'/admin':'/dashboard/settings'}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{user?.isPlatformAdmin?'Administrar plataforma':'Configurações'}</span>
            </Link>
          </DropdownMenuItem>}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
