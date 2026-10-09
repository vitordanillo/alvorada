'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="mx-auto max-w-lg space-y-4 p-8" role="alert"><h1 className="text-xl font-semibold">Não foi possível abrir esta página</h1><p>Se você estava concluindo uma operação, confira o histórico antes de tentar registrá-la novamente.</p><Button onClick={reset}>Tentar novamente</Button><a className="ml-4 underline" href="/profile">Abrir meu perfil</a></main>;}
