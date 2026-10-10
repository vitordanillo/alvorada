import { NextResponse } from 'next/server';
import {currentUser} from '@/lib/auth';
import {recordLoginAttempt} from '@/lib/login-rate-limit';

/**
 * Proxy para a BrasilAPI de consulta de CNPJ.
 * Isso evita problemas de CORS e centraliza o tratamento de erros.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const user=await currentUser();
  if(!user)return NextResponse.json({error:'Usuário não autenticado.'},{status:401});
  if(!['Administrador','Gerente','Estoquista'].includes(user.role))return NextResponse.json({error:'Acesso negado.'},{status:403});
  try{recordLoginAttempt('cnpj:'+user.uid,60);}catch{return NextResponse.json({error:'Aguarde antes de consultar novamente.'},{status:429});}
  const { cnpj } = await params;
  const digits = cnpj.replace(/\D/g, '');

  if (digits.length !== 14) {
    return NextResponse.json(
      { error: 'CNPJ inválido. Deve conter 14 dígitos.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 86400 }, // cache por 24h
        signal:AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'CNPJ não encontrado na base da Receita Federal.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Erro ao consultar a BrasilAPI.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Montar endereço completo
    const addressParts = [
      data.logradouro,
      data.numero,
      data.complemento,
      data.bairro,
    ].filter(Boolean);

    const result = {
      razaoSocial: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || '',
      endereco: addressParts.join(', '),
      cidade: data.municipio || '',
      estado: data.uf || '',
      cep: data.cep || '',
      telefone: data.ddd_telefone_1 || '',
      email: data.email ? String(data.email).toLowerCase() : '',
      situacao: data.descricao_situacao_cadastral || '',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    return NextResponse.json(
      { error: 'Erro de conexão com o serviço de consulta.' },
      { status: 503 }
    );
  }
}
