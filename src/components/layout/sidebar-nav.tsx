
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Users,
  Settings,
  CircleDollarSign,
  Truck,
  Banknote,
  AreaChart,
  ClipboardList,
  Wallet,
  Building2,
  ClipboardPlus,
  type LucideIcon,
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSkeleton } from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/context/app-context';
import type { User } from '@/lib/types';

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: User['role'][];
};

const allLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Gerente', 'Operador de Caixa', 'Estoquista'] },
  { href: '/pos', label: 'PDV', icon: ShoppingCart, roles: ['Administrador', 'Gerente', 'Operador de Caixa'] },
  { href: '/dashboard/cash-register', label: 'Caixa', icon: Banknote, roles: ['Administrador', 'Gerente', 'Operador de Caixa'] },
  { href: '/dashboard/products', label: 'Produtos', icon: Package, roles: ['Administrador', 'Gerente', 'Estoquista'] },
  { href: '/dashboard/inventory', label: 'Estoque', icon: Warehouse, roles: ['Administrador', 'Gerente', 'Estoquista'] },
  { href: '/dashboard/sales', label: 'Vendas', icon: CircleDollarSign, roles: ['Administrador', 'Gerente'] },
  { href: '/dashboard/reports', label: 'Relatórios', icon: AreaChart, roles: ['Administrador', 'Gerente'] },
  { href: '/dashboard/customers', label: 'Clientes', icon: Users, roles: ['Administrador', 'Gerente'] },
  { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Truck, roles: ['Administrador', 'Gerente'] },
  { href: '/dashboard/accounts-payable', label: 'Contas a Pagar', icon: Wallet, roles: ['Administrador', 'Gerente'] },
  { href: '/dashboard/purchase-orders', label: 'Pedidos de Compra', icon: ClipboardPlus, roles: ['Administrador', 'Gerente', 'Estoquista'] },
  { href: '/dashboard/logs', label: 'Logs do Sistema', icon: ClipboardList, roles: ['Administrador'] },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings, roles: ['Administrador'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, loadingAuth } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const visibleLinks = allLinks.filter(link => user?.storeId && link.roles.includes(user.role));

  const renderSkeletons = () => (
    <SidebarMenu className="flex-1">
      {[...Array(8)].map((_, i) => (
        <SidebarMenuItem key={i}>
            <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b">
        <Logo className="w-8 h-8" />
        <div className="group-data-[collapsible=icon]:hidden"><span className="font-bold font-headline text-lg">Alvorada</span><p className="text-xs text-muted-foreground">por Firma Conecta</p></div>
      </div>
      {(!isClient || loadingAuth) ? renderSkeletons() : (
        <SidebarMenu className="flex-1">
          {user?.isPlatformAdmin && <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname==='/dashboard/platform'} tooltip="Administrar lojas"><Link href="/dashboard/platform"><Building2/><span>Administrar lojas</span></Link></SidebarMenuButton></SidebarMenuItem>}
          {visibleLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </div>
  );
}
