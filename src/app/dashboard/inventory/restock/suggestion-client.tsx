
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lightbulb, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { suggestRestock, type SuggestRestockOutput } from '@/ai/flows/automatic-restock-suggestions';
import { useAppContext } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';

export function SuggestionClient() {
  const { products, loading: appContextLoading } = useAppContext();
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
      const input = {
        products: products.map(p => ({
          productId: p.id,
          productName: p.name,
          // NOTE: Usando dados de vendas de exemplo para a IA por enquanto.
          // A integração com dados de vendas reais será um próximo passo.
          salesData: [ 
            { date: '2024-07-20', quantitySold: Math.floor(Math.random() * 5) + 1 },
            { date: '2024-07-21', quantitySold: Math.floor(Math.random() * 5) + 1 },
            { date: '2024-07-22', quantitySold: Math.floor(Math.random() * 5) + 1 },
          ],
          currentStock: p.stock,
          minimumStock: p.minStock,
          unit: p.unit,
        }))
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

  if (!isClient || appContextLoading.products) {
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
