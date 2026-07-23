import type { StatCard as StatCardType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatCard({ title, value, icon: Icon }: Omit<StatCardType, 'change' | 'changeType'>) {
  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">{value}</div>
        {/* A lógica de comparação será adicionada em um passo futuro */}
        <p className="text-xs text-muted-foreground">
          Dados atualizados em tempo real
        </p>
      </CardContent>
    </Card>
  );
}
