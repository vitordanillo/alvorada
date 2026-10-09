# Perfil pessoal

A rota `/profile` atende todas as contas autenticadas, inclusive administradores globais sem loja. O menu da conta abre Perfil e direciona Configurações conforme o cargo. A central global também inclui o menu da conta.

O titular pode editar nome, enviar ou remover foto, trocar a própria senha com confirmação da atual e encerrar outras sessões. O e-mail, os cargos e os vínculos não são editáveis por este fluxo. Senhas novas exigem no mínimo 12 caracteres e no máximo 72 bytes. Cada alteração de senha ou revogação incrementa a versão da sessão e renova o cookie deste navegador; as outras sessões são recusadas na próxima requisição autenticada.

As ações determinam a conta pelo cookie, não por um identificador enviado pelo cliente. A migração `20261009003349_self_service_profile` adiciona uma política de edição própria e um trigger que impede alteração de e-mail, cargos, conta global, bloqueio e vínculos neste contexto. Eventos são registrados na auditoria sem senhas ou arquivos.

Fotos são convertidas em WebP de 256 × 256 no navegador, validadas e limitadas no servidor e servidas por uma rota autenticada. O arquivo só é acessível ao titular, a contas da loja ativa em comum ou à administração global. URLs antigas deixam de responder após substituição. Os diretórios e nomes são gerados pelo servidor.

O servidor define `ALVORADA_AVATAR_DIR` para `app-admin/uploads/avatars` por padrão, fora dos diretórios de build. Inclua esse diretório no backup; uma restauração apenas do banco não restaura os arquivos. Não exponha `uploads` como diretório estático público.

O teste `deploy/test-profile.cjs` exige um schema descartável `alvorada_profile_20261009_test` previamente criado com proprietário `alvorada_app` e uso concedido a `alvorada_runtime`. Aplica as migrações, cria contas artificiais, inicia uma cópia privada na porta 3072 e verifica Perfil, fotos, senha, sessões e isolamento. Remove somente esse schema e seu diretório de fotos ao concluir. Não utiliza as contas reais para troca de senha.

Publicação do Perfil: `ALVORADA_BUILD_DIR=.next-profile`. A versão anterior `.next-settings` permanece disponível para reversão do processo web.
