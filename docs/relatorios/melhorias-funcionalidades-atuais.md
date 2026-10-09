# Alvorada — melhorias nas funcionalidades atuais

Data: 08/10/2026 · Produto: Alvorada / Firma Conecta

## Objetivo e limites da análise

Este relatório prioriza evolução de funções que já existem. A análise considera o código da versão publicada na VPS, o painel global e os fluxos de Configurações e Perfil. Não equivale a uma auditoria completa de todas as operações reais de caixa, estoque e pagamentos. Cada item distingue uma constatação no código de uma recomendação de produto.

A cobrança continua manual, com assinatura independente por loja. Não é necessário ativar filiais para executar estas melhorias. As prioridades abaixo são propostas; nenhuma delas, além do Perfil solicitado, foi implementada nesta entrega.

## Entregas recentes que já devem ser consideradas concluídas

- Painel global separado da operação das lojas: lojas, usuários, planos, assinaturas, cobranças e auditoria.
- Conta global `admin@firmaconecta.com`; Vitor permanece administrador da loja.
- Correção da página Configurações: dados dos usuários obtidos a partir dos vínculos corretos.
- Perfil pessoal: nome, foto, dados de acesso, troca da própria senha e encerramento de outras sessões. E-mail, cargos e vínculos permanecem administrados centralmente.

## Prioridades

P0: risco de perda, duplicidade ou exposição de dados. P1: melhoria relevante para a rotina. P2: evolução útil após estabilização. Esforço relativo: pequeno, médio ou grande; não representa prazo fechado.

| ID | Área | Prioridade | Esforço | Resultado esperado |
|---|---|---|---|---|
| M01 | Vendas offline e sincronização | P0 | Médio | Reenvios sem duplicidade e pendências visíveis |
| M02 | Acesso público e autenticação | P0 | Médio | Login e operação por domínio com HTTPS |
| M03 | Continuidade e backups | P0 | Médio | Recuperação previsível da operação e das fotos |
| M04 | Carregamento de dados | P1 | Grande | Telas rápidas mesmo com histórico crescente |
| M05 | Pesquisa do cabeçalho | P1 | Médio | Busca que realmente navega para resultados |
| M06 | Relatórios existentes | P1 | Médio | Períodos corretos e indicadores consistentes |
| M07 | Caixa e conferência financeira | P1 | Médio | Divergências explicadas e rastreáveis |
| M08 | Estoque e compras | P1 | Médio | Reposição orientada por consumo e pendências |
| M09 | Assinaturas e cobranças manuais | P1 | Médio | Carteira mais clara e menos retrabalho |
| M10 | Usuários e permissões | P1 | Médio | Menor ambiguidade na gestão de acessos |
| M11 | Clientes, fiado e fidelidade | P2 | Médio | Histórico simples de entender e conferir |
| M12 | Erros, estados vazios e uso móvel | P1 | Médio | Recuperação de falhas sem telas em branco |

## Recomendações detalhadas

### M01 — Fechar o ciclo de segurança das vendas offline

**Constatação:** existe fila local por conta e loja, reconexão automática e suporte a `clientRequestId` no serviço de vendas. Na criação e no reenvio observados em `app-context.tsx`, não há garantia de geração de um identificador persistente por venda. Falhas da sincronização ficam principalmente no console.

**Melhoria:** gerar UUID antes da primeira tentativa, persistir o mesmo identificador na fila e reutilizá-lo em todas as tentativas. Exibir quantidade pendente, última sincronização e motivo de rejeição; permitir tentativa manual e tratamento orientado quando o caixa já estiver encerrado. Não descartar uma pendência antes da confirmação do servidor.

**Critério de aceite:** simular resposta perdida após o servidor confirmar a venda; o reenvio deve conservar uma única venda, um único impacto no estoque e um único lançamento financeiro. Operadores conseguem identificar e resolver cada pendência.

### M02 — Publicar por domínio com HTTPS

**Constatação:** o acesso utilizado é `http://151.243.24.208:3070`, exibido pelo navegador como não seguro.

**Melhoria:** definir domínio, TLS e proxy reverso; configurar cookies seguros e verificar redirecionamentos e origem das requisições após a mudança. Fazer a transição preservando o serviço atual até a validação.

**Critério de aceite:** login, Perfil, PDV, cobranças e upload de foto funcionam no domínio; nenhuma credencial é enviada por HTTP. A conexão de suporte continua auditada.

### M03 — Transformar a recuperação em rotina verificável

**Constatação:** há scripts de backup/restauração e um backup anterior à implantação do painel foi validado. Isso, isoladamente, não comprova uma política recorrente de retenção e recuperação. As fotos do Perfil ficam em arquivos privados na VPS, fora do diretório de build.

**Melhoria:** incluir banco, fotos, configuração e informações necessárias à recuperação em uma política de backup com retenção e cópia externa. Definir responsável, prazo máximo tolerável de perda de dados e tempo de recuperação. Testar restauração periodicamente em ambiente separado.

**Critério de aceite:** uma restauração reproduz usuários, lojas, vendas, cobranças e fotos; o relatório de execução registra data, resultado e integridade, sem expor segredos.

### M04 — Carregar dados conforme a tela precisa

**Constatação:** `getInitialDataAction` consulta históricos completos de vendas, caixas e movimentos, além dos cadastros. Diversas alterações acionam uma atualização ampla do contexto.

**Melhoria:** paginar no servidor, consultar por período e por tela, calcular agregados no banco e atualizar somente o que a operação afetou. Manter um conjunto adequado ao PDV offline, com limites documentados.

**Critério de aceite:** o tempo de carregamento e o volume transferido são medidos com base representativa; navegar em clientes não exige baixar todas as vendas. Filtros e exportações usam os mesmos critérios.

### M05 — Dar uma função clara à busca principal

**Constatação:** o campo “Buscar...” do cabeçalho não tem tratamento de pesquisa no layout analisado.

**Melhoria:** pesquisar produtos por nome, código e código de barras, clientes e vendas autorizadas; agrupar resultados por tipo e abrir a tela correspondente. Debounce, atalhos de teclado e mensagem de ausência de resultados.

**Critério de aceite:** pesquisar não revela dados de outra loja; Enter abre o resultado selecionado; a busca funciona com teclado e apresenta carregamento e erro.

### M06 — Tornar os relatórios consistentes por período

**Constatação:** o relatório de vendas usa objetos de data do estado com `setHours`; as chaves do gráfico são dia/mês, sem ano, e a ordenação reconstrói datas incompletas. Esses padrões merecem correção e teste em viradas de ano. A análise não quantifica divergências nas vendas reais.

**Melhoria:** evitar mutação do intervalo selecionado, agrupar por data ISO completa e aplicar fuso comercial consistente. Comparar período anterior, explicar receita/lucro/margem e adicionar exportação CSV com filtros preservados.

**Critério de aceite:** 31/12 e 01/01 aparecem em ordem e sem misturar anos; vendas canceladas têm tratamento explícito; total da exportação corresponde aos cartões e à tabela.

### M07 — Aprimorar a conferência do caixa

**Situação existente:** abertura, fechamento, movimentos, correções e reabertura já têm ações próprias.

**Melhoria:** destacar esperado, informado e diferença por meio de pagamento; exigir justificativa nas correções relevantes e mostrar o antes/depois. Tornar visível a relação entre movimento de caixa, recebimento de fiado e pagamento de conta.

**Critério de aceite:** alguém diferente do operador consegue reconstruir a diferença sem consultar logs técnicos; uma correção não apaga a evidência anterior.

### M08 — Fazer estoque e compras trabalharem juntos

**Situação existente:** estoque mínimo, validade no cadastro do produto, ajustes, entradas e pedidos de compra.

**Melhoria:** destacar baixo estoque, produtos sem giro e pedidos atrasados; sugerir reposição por consumo e estoque atual. Mostrar saldo pendente em recebimentos parciais e custos anteriores antes da confirmação. Controle de lotes é uma nova função e aparece no segundo relatório.

**Critério de aceite:** receber parte de um pedido mantém o restante pendente; ajustes exigem motivo; o operador entende quantidade, custo e efeito no estoque antes de confirmar.

### M09 — Organizar a carteira de cobranças manuais

**Situação existente:** planos, contratos mensais por loja, geração idempotente de cobranças, recebimento manual e estorno auditado. Atraso não suspende lojas automaticamente.

**Melhoria:** filtros por situação, vencimento e loja; resumo de inadimplência por faixa de atraso; detalhe do contrato e histórico de alterações; anexos privados para comprovantes e campos padronizados de referência. Explicar nos indicadores a diferença entre receita contratada, faturada e recebida.

**Critério de aceite:** um pagamento não é confundido com receita recorrente; estorno conserva histórico e motivo; preços antigos não mudam ao editar o plano; nenhuma suspensão ocorre por automação sem regra aprovada.

### M10 — Explicar melhor cargos e acessos

**Situação existente:** cargos por loja, bloqueio de conta, revogação de sessões e proteção do último administrador.

**Melhoria:** apresentar matriz simples de permissões, loja e cargo em cada vínculo; indicar sessões revogadas e conta bloqueada; pedir motivo para alterações administrativas sensíveis. Tratar redefinição administrativa de senha como temporária, com troca obrigatória futura.

**Critério de aceite:** remover um vínculo de loja não remove os demais; conta global não aparece como administrador operacional permanente; permissões são verificadas no servidor, inclusive em chamadas diretas.

### M11 — Explicar saldo, fiado e pontos

**Situação existente:** crédito, pagamentos, limite e fidelidade já participam do registro de vendas.

**Melhoria:** extrato unificado com venda, recebimento, cancelamento e saldo após cada movimento; explicar conversão dos pontos e evitar rótulos que confundam pontos com reais.

**Critério de aceite:** o saldo do cliente é reconciliável com o extrato; cancelar uma venda produz efeitos previsíveis no crédito e na fidelidade; mensagens indicam por que uma operação foi recusada.

### M12 — Padronizar recuperação de erros e experiência

**Constatação:** Configurações teve uma exceção que derrubava a página; o item Perfil anteriormente não tinha ação. O novo Perfil inclui estados de gravação, sucesso e erro.

**Melhoria:** adotar limites de erro por área, mensagem útil, “Tentar novamente”, estado vazio e tratamento de cache antigo. Auditar botões sem ação e campos sem função. Revisar formulários e tabelas em celular e com teclado.

**Critério de aceite:** uma resposta inválida não apaga a navegação; nomes ausentes e cache antigo não causam tela branca; controles têm rótulos e impedem envio repetido enquanto gravam.

## Ordem sugerida

1. Confiabilidade: M01, M02 e M03.
2. Rotina e clareza: M05, M06, M09, M10 e M12.
3. Escala e produtividade: M04, M07, M08 e M11.

Antes de fechar prazos, medir volume de dados, quantidade de lojas, equipamentos do PDV e frequência de operação offline. A revisão do código dá direção, mas não substitui esses dados de uso.

## Referências internas da análise

`src/context/app-context.tsx`, `src/lib/db-actions.ts`, `src/lib/sales-service.ts`, `src/components/reports/sales-report.tsx`, `src/app/dashboard/layout.tsx`, `src/lib/admin-actions.ts`, `src/lib/billing.ts`, `src/lib/auth.ts`, `src/lib/profile-actions.ts` e scripts de implantação/backup em `deploy/`.
