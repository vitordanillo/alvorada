'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLogo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user=await login(email, password);
      toast({ title: 'Login bem-sucedido!', description: 'Redirecionando para o painel...' });
      router.push(user.mustChangePassword?'/profile':user.isPlatformAdmin?'/admin':'/dashboard');
    } catch (cause) {
      setError('E-mail ou senha inválidos. Tente novamente.');
      toast({ variant: 'destructive', title: 'Falha no login', description: 'Confira seus dados e tente novamente.' });
      console.error(cause);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="mx-auto w-full max-w-sm rounded-2xl bg-background shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-full max-w-[260px] rounded-xl bg-white p-3"><BrandLogo className="h-auto w-full" /></div>
          <CardTitle className="sr-only">Granzoti Sistemas</CardTitle>
          <CardDescription>Gestão de lojas com Granzoti Sistemas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="username" placeholder="nome@exemplo.com" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center"><Label htmlFor="password">Senha</Label></div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} className="pr-10" />
                <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none" disabled={loading}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full rounded-lg py-6 text-lg font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">Peça ao administrador da loja para criar sua conta ou recuperar seu acesso.</p>
        </CardContent>
      </Card>
    </div>
  );
}
