# Alvorada

Sistema de gestão de lojas da Firma Conecta, feito com Next.js, Prisma e PostgreSQL no Supabase.

A aplicação atende várias lojas com dados isolados. Consulte [a arquitetura e o procedimento de publicação](docs/multi-store.md).

## Requisitos

- Node.js 20 ou superior.
- Um projeto Supabase dedicado ao Alvorada.
- A connection string PostgreSQL do projeto. Para uma VPS somente IPv4, use o pooler de sessão do Supabase.

## Configuração

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env` e configure `DATABASE_URL`, `AUTH_SESSION_SECRET` e, se usar recursos de IA, `GOOGLE_GENAI_API_KEY`.
3. Gere `AUTH_SESSION_SECRET` localmente com um gerador criptográfico seguro e mantenha-o apenas no ambiente de execução.
4. Configure `DATABASE_URL` com a credencial limitada `alvorada_runtime`. Use `DIRECT_DATABASE_URL` com a credencial de migração em um ambiente administrativo separado (`.env.migrate` na VPS). Provisione essa role e seu acesso ao schema antes de executar `npm run db:migrate`. As tabelas têm políticas de RLS e não são expostas pela Data API pública.
5. Crie o primeiro administrador uma única vez, sem seed de demonstração:

```powershell
$env:ALVORADA_ADMIN_NAME = Read-Host 'Nome do administrador'
$env:ALVORADA_ADMIN_EMAIL = Read-Host 'E-mail do administrador'
$securePassword = Read-Host 'Senha (mínimo 8 caracteres; recomende 16 ou mais)' -AsSecureString
$env:ALVORADA_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
npm run bootstrap:admin
Remove-Item Env:ALVORADA_ADMIN_PASSWORD
Remove-Variable securePassword
```

O bootstrap falha se já houver qualquer usuário e nunca sobrescreve contas. Ele cria a empresa cliente, a loja necessária, o administrador da plataforma e seu vínculo com a loja; produtos, clientes, vendas e fornecedores começam vazios. Não há credenciais padrão nem seed automático.

## Desenvolvimento e produção

- `npm run dev` inicia o Next.js em `http://localhost:3000`.
- `npm run typecheck` verifica os tipos TypeScript.
- `npm test` executa os testes de integração e requer uma base descartável isolada configurada em `TEST_DATABASE_URL`; o script recusa usar `DATABASE_URL`.
- `npm run build` gera a versão de produção.
- `npm start` inicia a versão de produção.

Nunca execute testes de integração contra uma base com dados de produção. Mantenha `.env` fora do Git e não exponha chaves administrativas ou a senha do PostgreSQL no navegador.
O Pix permanece indisponível até que um provedor real seja configurado; a aplicação não confirma pagamentos simulados.
Sem chave Google configurada, as sugestões de reposição usam o estoque mínimo cadastrado.

## VPS Windows

A instalação ativa utiliza `C:\Sites\AlvoradaSmartMarket\app-multistore`, porta 3070 e processo PM2 `alvorada-smart-market`. A pasta `app` preserva a versão anterior e não deve ser usada para iniciar a aplicação atual. O PM2 usa `C:\Sites\AlvoradaSmartMarket\pm2`; a tarefa de inicialização chama `deploy/resurrect.ps1` da versão ativa. A credencial runtime fica em `.env`; a de migração e backup, em `.env.migrate`. Ambos ficam fora do Git e têm ACL privada. O launcher carrega apenas `.env`.
Execute `node deploy/prepare-pm2.cjs` para preparar uma cópia própria do PM2 em `runtime/pm2`, ao lado de `app`. Ela usa canais Windows exclusivos da Alvorada; os comandos de gerenciamento devem chamar esse executável, e não o PM2 global.

`npm run build` gera o standalone e copia seus arquivos estáticos. Inicie-o com `deploy/ecosystem.config.cjs`; os logs ficam na pasta `logs` ao lado de `app`. `GET /api/health` verifica a conexão PostgreSQL. Para o acesso HTTP por IP solicitado, configure `AUTH_COOKIE_SECURE=false`; para HTTPS, use `true`.

Os testes usam o mesmo serviço de venda da aplicação, exigem um schema separado com sufixo `_test` e removem suas próprias linhas ao terminar. Validam troco, saldo de caixa, pontos, limite de crédito, validação de preço, Pix indisponível e concorrência de estoque.

## Histórico MySQL/MariaDB

As migrations antigas foram preservadas em `prisma/legacy-mysql-migrations` apenas como referência histórica. O banco MariaDB existente não faz parte desta aplicação e não é alterado nem importado.
