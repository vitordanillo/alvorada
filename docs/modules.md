# Módulos por empresa

O painel `/admin`, aba **Módulos por empresa**, libera ou bloqueia capacidades opcionais para uma `Organization`. Todas as lojas e filiais dessa empresa recebem a mesma liberação. Empresas novas começam com o módulo bloqueado; não há alteração automática de plano, assinatura ou mensalidade.

## Mesas e fichas

`mesas_fichas` adiciona `/dashboard/service` para administradores, gerentes e operadores de caixa. O áudio da cliente solicita fichas por unidade comprada, conta aberta por mesa, estoque e resumo de vendas. “Cadeiras” significa consumo das mesas, conforme esclarecido pelo proprietário; não há aluguel de mobiliário.

- Administrador ou gerente cadastra e desativa mesas.
- Operador abre uma conta e lança produtos; o estoque é baixado nesse momento.
- O preço do produto é preservado na conta. Fechar a mesa usa o caixa aberto e cria uma venda no fluxo existente, sem outra baixa de estoque.
- Estornos antes do pagamento exigem administrador ou gerente e motivo; devolvem estoque e mantêm histórico.
- Fichas representam unidades de uma venda já concluída. Emitir e reimprimir não baixa estoque. Reimpressões mantêm os códigos anteriores; a retirada é validada uma única vez na loja emissora. Vendas canceladas invalidam suas fichas.
- A venda direta de fichas aceita até 200 unidades de um produto. Também é possível emitir fichas de vendas existentes com quantidades inteiras, até 200 unidades no total.
- Pagamentos podem ser divididos em dinheiro, crédito, débito e Pix. Cartão continua agregado como `Cartão` no caixa existente e guarda `cardType` na venda para o resumo detalhado. O Pix desse módulo é recebido fora do aplicativo e confirmado manualmente pelo operador; não há integração financeira automática.
- O resumo usa dias de São Paulo e inclui vendas da loja em um período de até 31 dias, sangrias e despesas. Vendas antigas sem tipo de cartão aparecem como “Cartão sem tipo”.

As ações conferem a sessão, a loja, a função e a liberação atual no banco. RLS também restringe os registros do módulo. O administrador global pode consultar contas para conferir bloqueios de liberação; as operações comerciais exigem seleção explícita de uma loja. Bloquear um módulo conserva os dados e é recusado enquanto houver mesas abertas.

Os dados de atendimento exigem conexão com o servidor. Não são adicionados à fila offline do PDV.

## Implantação

A versão anterior encontrada na VPS (`app-admin`, commit `7e45ee2`) continha melhorias operacionais sem commit. O commit `efbeb7a` preserva esse código recuperado e suas três migrations, antes da implementação dos módulos.

Publicar somente uma versão construída em diretório separado. Antes da migration, guardar backup do banco. As novas tabelas são adicionais, não removem dados nem liberam módulos existentes. Manter as pastas privadas de uploads de avatares e comprovantes na versão anterior ou configurar caminhos compartilhados, para preservar acesso aos anexos. O PM2 do Alvorada contém o web e o worker de mensalidades; atualizar os dois caminhos e a tarefa de inicialização ao promover uma versão.

No PM2 6, o reinício pelo arquivo de processos preservou os caminhos resolvidos anteriores, mesmo com novos `cwd` e `script`. `node deploy/promote-processes.cjs` atualiza esses campos nos dois processos existentes pela API do daemon, guarda a configuração anterior no diretório privado de backups e confere os caminhos e a saúde do servidor. Em caso de erro, restaura a configuração anterior. Após a promoção, salvar o PM2 e atualizar a tarefa de inicialização. Na implantação de 9 de outubro, `guard_profile_update` precisou ter a propriedade alinhada para `alvorada_app` pela administração do Supabase antes de aplicar as migrations operacionais. A tentativa recusada foi desfeita pelo PostgreSQL e marcada como revertida no Prisma antes da aplicação completa.
