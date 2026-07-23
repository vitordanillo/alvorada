
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp) {
      // Handle Sign Up
      if (!name || !email || !password) {
        setError('Por favor, preencha todos os campos.');
        setLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // The onAuthStateChanged listener in app-context will handle creating the Firestore doc
        // and updating the app state. The redirection will be handled by the layout component.
        
        toast({
          title: 'Cadastro realizado com sucesso!',
          description: 'Redirecionando para o dashboard...',
        });
        router.push('/dashboard');
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          setError('Este e-mail já está em uso. Tente fazer login.');
          setIsSignUp(false); // Switch to login form
          toast({
            variant: 'destructive',
            title: 'E-mail já cadastrado',
            description: 'Este e-mail já está em uso. Tente fazer login.',
          });
        } else {
           setError('Ocorreu um erro no cadastro. Verifique os dados e tente novamente.');
           toast({
            variant: 'destructive',
            title: 'Falha no cadastro',
            description: 'Verifique os dados. A senha deve ter no mínimo 6 caracteres.',
          });
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      // Handle Login
      if (!email || !password) {
          setError('Por favor, preencha e-mail e senha.');
          setLoading(false);
          return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged listener in app-context will handle the state update.
        // The redirection will be handled by the layout component.
        
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o dashboard...',
        });
        router.push('/dashboard');
      } catch (err: any) {
        setError('E-mail ou senha inválidos. Tente novamente.');
        toast({
          variant: 'destructive',
          title: 'Falha no login',
          description: 'E-mail ou senha inválidos. Tente novamente.',
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleFormMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="mx-auto max-w-sm w-full bg-background shadow-2xl rounded-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="inline-block mx-auto">
            <Logo className="w-16 h-16" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">
            {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Preencha os dados para criar uma nova conta' : 'Entre com seu e-mail para acessar o painel'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: João da Silva"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@exemplo.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                {!isSignUp && (
                  <button type="button" onClick={() => alert('Função de recuperação de senha ainda não implementada.')} className="ml-auto inline-block text-sm underline">
                    Esqueceu sua senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full font-bold text-lg py-6 rounded-lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Cadastrar' : 'Entrar')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button type="button" onClick={toggleFormMode} className="underline font-semibold">
              {isSignUp ? 'Faça login' : 'Cadastre-se'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
