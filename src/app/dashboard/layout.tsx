
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { StoreSelector } from '@/components/layout/store-selector';
import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/layout/user-nav';
import { useAuth } from '@/context/app-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loadingAuth, dataError } = useAuth();
  const router = useRouter();
  const pathname=usePathname();

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, redireciona para o login.
    if (!loadingAuth && !user) {
      router.push('/');
    } else if (!loadingAuth && user && !user.storeId && pathname!=='/dashboard/platform') {
      router.replace(user.isPlatformAdmin?'/dashboard/platform':'/');
    }
  }, [user, loadingAuth, router, pathname]);

  // Enquanto o estado de autenticação está sendo verificado, mostra um loader.
  // Isso evita que o conteúdo do dashboard seja exibido brevemente antes do redirecionamento.
  if (loadingAuth || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset className="bg-secondary">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                <StoreSelector />
            </div>
            <div className="flex flex-1 items-center gap-4 md:ml-auto md:flex-none">
                <div className="relative ml-auto flex-1 md:grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar..."
                        className="w-full rounded-lg bg-background pl-10 md:w-[200px] lg:w-[320px]"
                    />
                </div>
                <UserNav />
            </div>
        </header>
        <main className="flex-1 p-6">{dataError && <p role="alert" className="mb-4 rounded-md border border-destructive p-3 text-destructive">{dataError}</p>}{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
