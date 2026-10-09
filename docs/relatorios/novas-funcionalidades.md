# Alvorada — novas funcionalidades propostas

Data: 08/10/2026 · Produto: Alvorada / Firma Conecta

## Direção do produto

Evoluir a plataforma para permitir que a Firma Conecta administre várias lojas independentes e que cada loja opere com menos trabalho manual. Nesta fase, a assinatura pertence à loja; filiais não são uma dependência. As funções abaixo são propostas de desenvolvimento, sem contratação de serviços externos ou ativação de cobranças nesta entrega.

O Perfil e a administração global já entregues não são tratados como novidades pendentes. A lista separa uma nova capacidade de produto das melhorias nas capacidades atuais apresentadas no outro relatório.

## Visão de prioridades

| ID | Nova capacidade | Prioridade | Esforço relativo | Dependências principais |
|---|---|---|---|---|
| N01 | Central de alertas e tarefas | Alta | Médio | Eventos confiáveis e regras por loja |
| N02 | Assistente de implantação da loja | Alta | Médio | Planos, contratos e permissões claros |
| N03 | Importação guiada de cadastros | Alta | Médio | Validação, deduplicação e prévia |
| N04 | Lotes e validade por entrada | Alta para perecíveis | Grande | Modelo de estoque e migração |
| N05 | Convites e recuperação de conta | Alta | Médio | HTTPS e serviço de e-mail |
| N06 | Portal comercial da loja | Média | Médio | Regras da assinatura e controle de acesso |
| N07 | Central de suporte | Média | Médio | Auditoria e anexos privados |
| N08 | Inventário por contagem | Média | Médio | Ajustes auditados e concorrência |
| N09 | Devoluções e trocas | Média | Grande | Regras financeiras e de estoque |
| N10 | Cobrança integrada e conciliação | Futura | Grande | Escolha de provedor e regras comerciais |
| N11 | Autenticação em duas etapas | Alta para admin global | Médio | Recuperação segura e HTTPS |
| N12 | Integração fiscal | Conforme mercado | Grande | Provedor e validação especializada |
| N13 | API de integrações | Futura | Grande | Escopos, quotas e observabilidade |

## Escopo recomendado por função

### N01 — Central de alertas e tarefas

**Para quem:** administrador global e responsáveis das lojas.

**Primeira versão:** caixa com divergência, produtos abaixo do mínimo, compra atrasada, conta a pagar vencida, assinatura sem contrato definido e cobrança pendente. Cada alerta terá responsável, prazo, link para a origem e opção de marcar como resolvido. Separar “sem pendências” de “dados indisponíveis”.

**Automação:** recalcular alertas periodicamente e evitar criar o mesmo aviso a cada execução. Avisos internos primeiro; e-mail e WhatsApp em etapa posterior, com preferências e autorização.

**Aceite:** um alerta pertence à loja correta, desaparece ou é concluído quando a origem é resolvida e não gera notificações repetidas sem mudança. O admin global tem visão consolidada sem obrigar o usuário da loja a conhecer outras empresas.

### N02 — Assistente de implantação de uma nova loja

**Para quem:** equipe da Firma Conecta.

**Primeira versão:** fluxo em etapas para dados da loja, responsável, plano, assinatura, usuários e importação opcional. Checklist de operação: cadastros, configuração financeira, abertura de caixa e venda de treinamento em ambiente apropriado.

**Aceite:** o cadastro pode ser retomado; não cria loja, usuário ou contrato duplicado ao reenviar; a conclusão mostra o que falta antes da liberação operacional. A assinatura permanece independente por loja.

### N03 — Importação guiada por planilha

**Para quem:** lojas migrando de planilhas ou de outro sistema.

**Primeira versão:** produtos, clientes e fornecedores por CSV/XLSX, com modelo para download, mapeamento de colunas, prévia, erros por linha e resumo do que será criado ou atualizado. Produtos devem ter estratégia explícita para SKU e código de barras duplicados.

**Aceite:** uma planilha inválida não altera dados parcialmente sem informar; reimportar o mesmo arquivo não duplica cadastros; existe histórico da importação e regra de reversão dos itens que ainda não tiveram movimentações.

### N04 — Lotes e validade por recebimento

**Para quem:** mercados e lojas com perecíveis.

**Primeira versão:** número de lote, validade, custo e saldo em cada entrada. Consumo com prioridade ao lote que vence primeiro, alertas de vencimento e baixa por perda com motivo.

**Dependência:** hoje a validade aparece no cadastro do produto. É necessário decidir como migrar o saldo existente: lote inicial identificado como legado, sem inventar validade ou custo ausentes.

**Aceite:** duas entradas do mesmo produto mantêm validades e custos diferentes; venda, devolução e perda atualizam os lotes corretos; relatório de perda é reconciliável com ajustes.

### N05 — Convites, recuperação e senha temporária

**Para quem:** novos usuários e pessoas que esqueceram a senha.

**Primeira versão:** convite por link de uso único, prazo de validade e redefinição por e-mail. Senhas definidas pelo administrador podem exigir troca no primeiro login. Respostas de recuperação não devem revelar se um e-mail tem conta.

**Dependências:** domínio com HTTPS, serviço de e-mail, remetente configurado, limite de tentativas e gestão de expiração.

**Aceite:** link usado ou vencido não funciona novamente; a redefinição invalida as sessões anteriores; convite não permite escolher cargos superiores aos concedidos.

### N06 — Portal comercial da própria loja

**Para quem:** proprietário ou administrador autorizado da loja.

**Primeira versão:** plano, valor contratado, vencimento, usuários disponíveis, histórico de cobranças, instruções de pagamento manual e envio de comprovante. O admin global continua confirmando o recebimento.

**Aceite:** enviar comprovante não quita cobrança automaticamente; a loja não vê contratos alheios nem altera preço, limite ou vencimento unilateralmente. Estados “enviado”, “em análise” e “confirmado” têm significado claro.

### N07 — Central de suporte com histórico

**Para quem:** usuários das lojas e equipe da Firma Conecta.

**Primeira versão:** chamado vinculado à loja, categoria, prioridade, responsável, comentários e anexos privados. Associar acesso de suporte ao chamado e ao motivo já registrado na auditoria.

**Aceite:** autor e histórico são preservados; o suporte não recebe a senha do cliente; anexos respeitam tamanho e tipo e só são acessíveis aos envolvidos autorizados.

### N08 — Inventário por contagem

**Para quem:** responsáveis pelo estoque.

**Primeira versão:** abrir inventário completo ou por categoria, contagem sem exibir o saldo esperado, reconferência de divergências e aprovação dos ajustes. Registrar a referência temporal do estoque contado.

**Aceite:** vendas durante a contagem têm tratamento definido; concluir o inventário não aplica ajustes duas vezes; diferença, responsável e justificativa ficam auditados.

### N09 — Devoluções e trocas parciais

**Para quem:** atendimento e gerência da loja.

**Primeira versão:** escolher itens e quantidades de uma venda, decidir retorno ao estoque ou perda, registrar motivo e gerar crédito ou restituição conforme política da loja. Troca relaciona a saída nova à devolução anterior.

**Aceite:** não devolver mais do que foi vendido; considerar pontos, fiado e pagamentos mistos; exigir autorização adequada; preservar venda original e todos os movimentos resultantes.

### N10 — Cobrança integrada e conciliação

**Para quem:** gestão comercial da Firma Conecta.

**Etapa futura:** geração de Pix/boleto/cartão por provedor escolhido, confirmação por webhook e conciliação. Começar em ambiente de testes, mantendo cobranças manuais disponíveis para exceções.

**Decisões necessárias:** provedor, taxas, política de vencimento, cancelamento, reembolso e suspensão. Não presumir suspensão automática como consequência do atraso.

**Aceite:** webhook assinado e repetido não duplica recebimento; valor e destinatário correspondem ao contrato; cobrança manual e automática não contabilizam o mesmo pagamento duas vezes. Taxas e estornos têm registro separado.

### N11 — Autenticação em duas etapas

**Para quem:** inicialmente a conta global; depois administradores das lojas.

**Primeira versão:** aplicativo autenticador, códigos de recuperação de uso único e confirmação em ações administrativas críticas. Não exigir SMS como única forma de recuperação.

**Aceite:** habilitação e recuperação exigem verificação do titular; códigos não são armazenados em texto claro; perda do dispositivo tem procedimento que não abre acesso indevido à plataforma.

### N12 — Integração fiscal

**Para quem:** lojas cujo processo exige emissão fiscal integrada.

**Escopo a definir:** emissão, consulta, cancelamento e contingência com um provedor adequado à operação. A escolha depende da localização e das exigências de cada cliente e deve passar por validação especializada antes de implementação.

**Aceite de produto:** documento vinculado à venda, estados claros, envio idempotente e histórico das respostas. O comprovante atual de venda e um registro manual de recebimento não devem ser apresentados como emissão fiscal.

### N13 — API e integrações autorizadas

**Para quem:** lojas com e-commerce, contabilidade ou ferramentas externas.

**Primeira versão:** leitura de produtos, estoque e vendas por loja; credenciais com escopos, expiração, revogação e limites. Webhooks com assinatura, retentativas e histórico de entrega.

**Aceite:** uma chave restrita ao estoque não lê clientes nem modifica contas; todas as operações respeitam a loja autorizada; revogação impede uso posterior; documentação indica limites e versionamento.

## Fases sugeridas

**Fase 1 — Adesão e segurança:** N02, N03, N05 e N11. Antes, concluir HTTPS, backups recorrentes e confiabilidade offline, propostos no relatório de melhorias.

**Fase 2 — Rotina assistida:** N01, N06, N07 e N08. Priorizar N04 se perecíveis forem parte central da operação.

**Fase 3 — Ampliação comercial:** N09, N10, N12 e N13, conforme demanda comprovada. Nenhuma integração externa deve ser contratada apenas para completar esta lista.

## Fora do escopo imediato

Filiais com gestão consolidada, transferências entre lojas, franquias, múltiplos estoques por estabelecimento e aplicativo nativo. O modelo atual permite várias lojas, mas estas capacidades exigem regras adicionais. Avaliar quando houver uma operação real que justifique o investimento.

## Como escolher a próxima entrega

Pontuar cada proposta por frequência de uso, retrabalho eliminado, risco reduzido, receita potencial e esforço. Selecionar uma entrega pequena com resultado verificável. Sugestão inicial: corrigir a busca principal e a segurança de reenvio offline, depois implementar implantação guiada e importação de cadastros.
