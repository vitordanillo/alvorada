# Alvorada para Windows

## Instalação e uso

Instalador NSIS para Windows x64. Identidade permanente `com.firmaconecta.alvorada` e GUID `c746d24a-c962-4f47-8202-f1521c24d047`; manter ambos em todas as releases. Instalação por usuário, atalho Alvorada, sem necessidade de acesso ao Supabase no computador do cliente.

No primeiro acesso, conectar, autenticar e aguardar **Dispositivo preparado para operar offline**. O pacote inclui os arquivos JS/CSS e a marca do sistema. As páginas autenticadas são preparadas após a seleção da loja; o serviço de protocolo do desktop guarda essas páginas em SQLite e utiliza a cópia local quando a rede falha. O service worker também mantém o shell no perfil persistente do aplicativo. Nunca são simuladas confirmações de POST ou APIs.

O banco `alvorada.sqlite` fica em `%APPDATA%\FirmaConecta\Alvorada`, fora da instalação. Dados e filas são separados por usuário e loja. As operações comerciais usam o protocolo 1 de `/api/offline/operations`, sessão HTTP e validação de permissões no servidor. Credenciais do banco, segredo de sessão e chaves privilegiadas não entram no pacote. SQLite usa WAL, `synchronous=FULL`, transações e migração inicial atômica do IndexedDB, preservando a origem. Carrinho e sessão offline permanecem no perfil Chromium persistente em `browser`.

### Limites

Login inicial, renovação de sessão, administração de contas/permissões e integrações externas exigem rede. A sessão offline mantém o prazo atual de sete dias. A preparação de páginas e dados é obrigatória: a primeira instalação sem internet não permite entrar em uma loja desconhecida. Capacidades e limites de dados offline descritos em `offline.md` continuam aplicáveis. O desktop reaproveita o Next.js e suas páginas preparadas; não inclui um servidor Prisma/Postgres local nem promete todas as telas administrativas offline.

## Atualizações automáticas

O `electron-updater` consulta `https://alvorada.firmaconecta.com/desktop-updates/` após 15 segundos da abertura e a cada quatro horas. Há também **Alvorada → Verificar atualizações**. Baixa em segundo plano, informa progresso, preserva atendimento e aplica ao encerrar voluntariamente. Antes de aplicar, cria cópia consistente do SQLite e descarrega os dados do perfil. Falha no backup adia a atualização. O cliente não precisa baixar e executar outro instalador manualmente.

Manter a conexão para receber a nova versão. Enquanto offline, a versão atual continua disponível; a entrega será tentada novamente. Não há garantia de entrega imediata a um computador desligado ou desconectado.

Backups ficam na subpasta `backups`, com retenção de dez cópias. A desinstalação preserva os dados. Uma migração futura deve aumentar `PRAGMA user_version`, ser transacional e preservar filas/identificadores; o código bloqueia abertura de esquema superior ao conhecido. Recuperação de publicação exige uma versão maior corrigida; downgrade automático é bloqueado.

### Canal de publicação

- Executáveis e blockmaps possuem nomes por versão; versões publicadas são imutáveis.
- `desktop/publish.cjs` confere versão, tamanho e SHA-512, publica os binários primeiro e troca `latest.yml` por último.
- O canal é servido pelo Caddy por HTTPS, sem listagem de diretórios. A URL `Alvorada-Setup.exe` atende novas instalações.
- A tarefa Windows `Alvorada-Desktop-Releases` consulta tags `desktop-vMAJOR.MINOR.PATCH` a cada 30 minutos. A maior release nova é construída em worktree próprio, com dependências fixadas pelo lockfile; só depois de um build bem sucedido é publicado o manifesto. Falhas preservam a versão publicada e ficam em `backups\desktop-release-worker.log`.
- `.github/workflows/desktop-release.yml` cria automaticamente uma tag com a próxima versão em publicações da branch `main` que alterem interface/desktop. `workflow_dispatch` também permite uma release. Branches de desenvolvimento não são publicadas automaticamente; para uma release aprovada fora da main, atualizar package/lock e publicar a tag correspondente.
- A tarefa deve manter a origem Git, o executável Node, o Git e o acesso à rede. O arquivo `latest.json` mostra a versão publicada. Builds e atualizações não substituem o processo de homologação.

### Assinatura do Windows

A primeira versão é **sem assinatura Authenticode**. HTTPS e SHA-512 protegem transporte e integridade; não substituem a identificação do editor. O Windows pode exibir aviso de editor desconhecido. Para a distribuição comercial, configurar certificado de assinatura da Firma Conecta ou serviço de assinatura, mantendo o mesmo appId/GUID; não há certificado de assinatura disponível nesta configuração inicial. O updater mantém seu mecanismo padrão de verificação de assinatura quando o publisher é configurado, sem exceções personalizadas.

## Construção

```powershell
cd desktop
npm ci
npm run prepare:assets
npm run dist
```

`prepare:assets` utiliza o manifesto público da versão web publicada e só inclui arquivos de interface autorizados. Não incluir `.env`, banco local ou dados de clientes no instalador. Para atualizar a interface do site, publicar o build web antes da release desktop.

Referências: [Electron: isolamento e segurança](https://www.electronjs.org/docs/latest/tutorial/security/), [electron-builder: atualização automática](https://www.electron.build/v26/docs/features/auto-update/), [SQLite no Node](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).
