# Alvorada — várias lojas

Uma aplicação atende todas as lojas. Cada loja tem UUID permanente e pertence a uma empresa cliente (`Organization`), que pode ter várias filiais. `StoreMembership` associa cada usuário às lojas e aos cargos autorizados. O campo legado `User.storeId` é apenas a seleção inicial para contas antigas.

## Administração

- A conta do proprietário da Firma Conecta recebe `isPlatformAdmin` por uma operação administrativa de implantação, fora do aplicativo.
- `/dashboard/platform` cria lojas, vincula usuários existentes, suspende e reativa lojas. Ações de suporte e de administração ficam em `PlatformAuditLog`.
- O administrador da loja gerencia seus funcionários e seus dados de identificação em Configurações.
- O seletor de loja aparece para usuários com várias lojas. A seleção é assinada na sessão e as permissões são consultadas novamente no servidor.
- Suspensão bloqueia o acesso aos registros da loja; os dados e o histórico são preservados.

## Isolamento

O servidor valida a loja enviada pela tela contra a sessão e as permissões atuais. A credencial `alvorada_runtime` não é proprietária das tabelas e não tem `BYPASSRLS`, criação de roles ou de bancos. RLS aplica a loja em leituras e escritas, mesmo quando uma consulta esquece o filtro explícito. O contexto é definido por `set_config(..., true)` dentro de cada transação, evitando compartilhamento entre conexões do pool.

`alvorada_app` é a credencial de migração e backup; fica em `.env.migrate`, acessível somente a Administrators e SYSTEM na VPS. O processo web carrega apenas `.env`, com a credencial limitada. Nenhuma dessas credenciais é enviada ao navegador.

Os relacionamentos de caixa, fornecedores e estoque usam restrições que incluem `storeId`; os itens em JSON são conferidos por triggers. Produtos têm SKU único por loja e contador próprio. A configuração de cancelamento também pertence à loja. A exclusão de lojas e de clientes com histórico financeiro não está disponível.

Comprovantes guardam uma cópia dos dados da loja no momento da venda ou do recebimento. As vendas anteriores à evolução receberam os dados cadastrados da loja na migração. Alterações posteriores não modificam esses comprovantes.

O cache e as filas offline usam um banco IndexedDB diferente para cada usuário e loja. Filas da versão anterior são recuperadas apenas quando o servidor confirma que a sessão de caixa pertence à loja atual. O cache antigo compartilhado não é consultado. Um identificador persistente por venda impede duplicação durante reenvios da fila.

## Backup e publicação

`node deploy/backup-database.cjs` produz um snapshot consistente, checksum SHA-256, definições de tabelas, schema Prisma e migrations. A configuração de recuperação é guardada na mesma pasta privada `backups`, fora do Git. O script recusa backup parcial devido a RLS.

`node deploy/restore-snapshot.cjs <arquivo> alvorada_restore_<identificador>` restaura e compara todos os registros numa cópia privada, cuja criação é feita pela administração do banco. Esse comando exige um schema vazio e recusa o nome de produção. O schema restaurado serve para conferir os dados; a publicação de uma recuperação exige aplicar as migrations e permissões correspondentes antes de apontar o aplicativo para ele.

Para publicar: gerar candidato em diretório separado; guardar backup final e versão anterior; parar somente o processo Alvorada; aplicar `prisma migrate deploy` usando `DIRECT_DATABASE_URL`; registrar o novo diretório no PM2 com a credencial runtime; conferir saúde e login; salvar o PM2 e apontar a tarefa de inicialização para a versão ativa. Preserve o diretório anterior: no Windows, processos podem manter a pasta bloqueada para renomeação. A versão atual está em `C:\Sites\AlvoradaSmartMarket\app-multistore`. Migrações futuras devem manter compatibilidade ou prever recuperação explícita. O PM2 global e os demais aplicativos da VPS não fazem parte desse procedimento.

## Limites atuais

As lojas compartilham a infraestrutura e a disponibilidade do aplicativo. Backups são do conjunto de lojas; recuperação seletiva requer importação filtrada e conferida. Pix depende de integração com provedor real. O endereço por IP usa HTTP conforme a implantação inicial; um domínio com HTTPS deve acompanhar a disponibilização comercial.
