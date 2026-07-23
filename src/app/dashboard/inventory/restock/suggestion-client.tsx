
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lightbulb, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { suggestRestock, type SuggestRestockOutput } from '@/ai/flows/automatic-restock-suggestions';
import { useAppContext } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';

export function SuggestionClient() {
  const { products, sales, loading: appContextLoading } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestRestockOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGenerateSuggestions = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);

    if (products.length === 0) {
        setError('Nenhum produto encontrado para análise. Adicione produtos no seu inventário primeiro.');
        setLoading(false);
        return;
    }

    try {
      const activeSales = sales.filter(s => s.status === 'Concluída');
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const input = {
        products: products.map(p => {
          const salesData = last7Days.map(dateStr => {
            let quantitySold = 0;
            activeSales.forEach(sale => {
              const saleDateStr = new Date(sale.date).toISOString().split('T')[0];
              if (saleDateStr === dateStr) {
                const item = sale.items.find(item => item.productId === p.id);
                if (item) {
                  quantitySold += item.quantity;
                }
              }
            });
            return { date: dateStr, quantitySold };
          });

          return {
            productId: p.id,
            productName: p.name,
            salesData,
            currentStock: p.stock,
            minimumStock: p.minStock,
            unit: p.unit,
          };
        })
      };
      const result = await suggestRestock(input);
      setSuggestions(result);
    } catch (e) {
      setError('Falha ao gerar sugestões. Tente novamente.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || appContextLoading.products || appContextLoading.sales) {
    return (
      <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
        </Card>
    )
  }

  return (
    <div>
      <div className="flex justify-start mb-6">
        <Button onClick={handleGenerateSuggestions} disabled={loading || appContextLoading.products} size="lg" className="rounded-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-4 w-4" />
              Gerar Sugestões de Reposição
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/> Erro</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
            </CardContent>
        </Card>
      )}

      {suggestions && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.restockSuggestions.length > 0 ? (
            suggestions.restockSuggestions.map((suggestion) => (
              <Card key={suggestion.productId} className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="text-primary"/>
                    {suggestion.productName}
                  </CardTitle>
                  <CardDescription>ID do produto: {suggestion.productId}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade para repor</p>
                    <p className="text-2xl font-bold font-headline">{suggestion.quantityToRestock} {suggestion.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Justificativa da IA</p>
                    <p className="text-sm">{suggestion.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full bg-green-100/50 border-green-500 rounded-2xl">
              <CardContent className="p-6 flex items-center justify-center text-center gap-4">
                  <CheckCircle className="h-8 w-8 text-green-600"/>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Tudo em ordem!</h3>
                    <p className="text-sm text-green-700">Nenhum produto precisa de reposição no momento.</p>
                  </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
