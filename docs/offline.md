# Operação offline do Alvorada

Endereço público: https://alvorada.firmaconecta.com.

## Preparação do dispositivo

Entre com sua conta, selecione a loja e aguarde **Dispositivo preparado para operar offline**. A preparação salva o aplicativo, a sessão local e os dados da loja. Cada computador e navegador precisa ser preparado enquanto conectado. HTTPS é obrigatório para reabrir a página sem rede; o endereço HTTP por IP permite apenas continuar a página já carregada.

## Operações locais

- PDV, carrinho persistente, recibo pendente e pagamentos registrados pelo operador.
- Caixa: abertura, fechamento, movimentações, recebimento de fiado e correções pela gerência.
- Produtos, clientes, fornecedores e contas a pagar: criação, edição e situação.
- Entrada e ajuste de estoque, pedidos de compra e recebimentos.
- Mesas: cadastro, abertura, consumo, estorno e fechamento; fichas: venda, impressão e retirada de códigos disponíveis no dispositivo.
- Busca e listagem dos dados disponíveis no dispositivo. Pedidos e extratos têm rotas estáticas compatíveis com reabertura offline.

Os registros locais são provisórios até a confirmação do servidor. Estoque, caixa e saldos são projetados a partir da última cópia confirmada mais as operações pendentes; a base confirmada não é sobrescrita com projeções, evitando aplicar a mesma baixa duas vezes após recarregar.

## Sincronização e conflitos

As operações são gravadas no IndexedDB antes de enviar. Cada conta e loja tem uma base separada, fila ordenada e identificador persistente por operação. A fila é retomada quando a conexão retorna e verificada a cada 30 segundos enquanto o aplicativo está aberto.

O servidor revalida a sessão, a função do usuário, a loja e os módulos. A alteração e seu recibo de confirmação são gravados em uma única transação serializável, com RLS. A repetição do mesmo identificador devolve a confirmação anterior. O instante original da operação é preservado nos movimentos financeiros.

A primeira recusa pausa a fila: a operação e suas dependentes permanecem salvas. O painel mostra o motivo, permite nova tentativa e descarte explícito de uma operação definitivamente recusada. Nunca cadastrar novamente uma venda cuja confirmação esteja pendente. Alterações concorrentes de preço, estoque, caixa ou saldos precisam de revisão.

Nenhum dispositivo isolado pode saber imediatamente o que outro dispositivo offline fez. Isso inclui estoque compartilhado e uso de uma mesma ficha em dois computadores; a sincronização identifica as recusas, mas não desfaz uma entrega física já realizada.

## Mudança do endereço HTTP para HTTPS

Dados locais pertencem à origem do navegador. Para transportar pendências existentes:

1. No endereço antigo http://151.243.24.208:3070, abra **Sincronização > Exportar pendências**.
2. Entre em https://alvorada.firmaconecta.com com a mesma conta e loja.
3. Abra **Importar pendências**, selecione o arquivo e use **Sincronizar agora**.

A fila antiga de vendas continua compatível e é processada antes das operações novas. Não limpar o armazenamento enquanto houver pendências. O arquivo exportado contém dados comerciais e deve ser guardado pela própria empresa.

## Limites concretos

- Autenticação inicial, troca de loja, senhas, permissões, liberação de módulos e cancelamento de venda protegido por senha exigem o servidor; não se armazenam senhas para autorização offline.
- IA, serviços externos, envio de mensagens e confirmação bancária exigem conexão. Cartão e Pix registrados no Alvorada não significam que o pagamento externo foi autorizado sem rede.
- Relatórios não consultados previamente precisam de conexão. Extratos offline usam o histórico disponível no dispositivo, com indicação de saldos anteriores.
- O catálogo atual guarda até 5.000 produtos, clientes e fornecedores; o histórico operacional inclui até 100 registros por categoria. Há aviso para catálogo incompleto. Fichas antigas não presentes no dispositivo precisam ser consultadas online.
- A sessão local expira em sete dias. Logout remove a sessão local e bloqueia o shell privado; a fila permanece separada e recuperável ao entrar na mesma conta.
- A fila precisa do aplicativo aberto para enviar; não há promessa de execução depois de fechar o navegador. O navegador pode negar armazenamento persistente; exportar pendências fornece uma cópia adicional.

## Publicação

Diretório da versão: C:\Sites\AlvoradaSmartMarket\app-offline-20261009. Aplicativo e worker financeiro usam PM2 privado. O proxy Caddy encaminha o domínio HTTPS para 127.0.0.1:3070 e preserva os demais sites da VPS. A tabela privada OfflineReceipt usa SELECT/INSERT restritos ao usuário e à loja, sem grants para anon/authenticated/PUBLIC.

A publicação inclui checagem de tipos, build, análise das regras de acesso e consultas de saúde/metadados. Os fluxos comerciais e a simulação de desconexão no navegador não foram exercitados automaticamente nesta atualização.
