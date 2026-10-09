# Administração da Firma Conecta

O painel global fica em `/admin`. A conta `admin@firmaconecta.com` entra diretamente nele, sem vínculo permanente com lojas. Vitor permanece administrador operacional da Alvorada Smart Market.

## Recursos publicados

- Visão geral com lojas, receita recorrente contratada, recebimentos do mês e cobranças pendentes.
- Cadastro e edição de lojas, agrupamento por empresa, suspensão e reativação com motivo.
- Criação de contas, vínculos e cargos por loja, proteção do último administrador ativo, bloqueio, redefinição de senha e revogação de sessões.
- Planos mensais com preço e limite de usuários por loja. Alterar um plano não modifica contratos existentes.
- Uma assinatura independente por loja, com preço e limite contratados, pausa, cancelamento e retomada.
- Geração idempotente de cobranças por competência, recebimento manual, referência de pagamento, estorno do registro e cancelamento auditado.
- Auditoria paginada e pesquisável. Acesso de suporte exige motivo, preserva a identidade global e oferece retorno ao painel.

`alvorada-billing` roda no PM2 privado da aplicação e verifica vencimentos a cada hora. O administrador também pode solicitar uma sincronização. Datas comerciais usam America/Sao_Paulo e valores são armazenados em centavos. Os contratos existentes não recebem preços presumidos: cadastre os planos e contratos reais no painel.

Pagamentos são registros administrativos; o sistema não processa cobranças bancárias ou emite documentos fiscais. Atrasos aparecem como pendências e não suspendem lojas automaticamente. A suspensão de lojas é independente da situação da assinatura.

## Implantação

Versão ativa: `C:\Sites\AlvoradaSmartMarket\app-modules-20261009`. As versões anteriores permanecem em `app-admin` e `app-multistore`. O diretório de build é escolhido por `ALVORADA_BUILD_DIR`; a publicação atual usa `.next`. O PM2 e a tarefa AlvoradaSmartMarket-Startup restauram os processos web e de cobranças.

Validação: build e TypeScript, testes de fim de mês/ano bissexto, testes de autorização e cobrança em schema descartável, login HTTP e navegação no navegador, acesso de suporte e preservação dos vínculos de Vitor. O backup anterior à mudança foi restaurado e seus registros conferidos em uma cópia separada.

## Módulos por empresa

A liberação de **Mesas e fichas** ocorre por empresa e alcança suas lojas. As liberações e bloqueios têm motivo obrigatório e auditoria. Mesas abertas impedem bloqueio. [Detalhes do módulo](modules.md).
