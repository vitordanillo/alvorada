
'use client';

import { PageHeader } from "@/components/page-header";
import { UserManagementTable } from "@/components/settings/user-management-table";
import { SecuritySettingsCard } from "@/components/settings/security-settings-card";
import { useAppContext } from "@/context/app-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";

export default function SettingsPage() {
  const { allUsers, loading, updateUserRole, user, updateCancellationPassword } = useAppContext();

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
                       Entre em contato com o administrador do sistema para obter acesso.
                    </p>
                </div>
            </Card>
        </div>
     )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações da sua loja e do sistema."
      />
      {loading.allUsers ? (
        <Card className="rounded-2xl border-none shadow-sm bg-card">
            <Skeleton className="h-[250px] w-full" />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <UserManagementTable users={allUsers} onUpdateRole={updateUserRole} />
          <SecuritySettingsCard onUpdatePassword={updateCancellationPassword} />
        </div>
      )}
    </div>
  );
}
