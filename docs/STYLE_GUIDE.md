# Design System & UI/UX Style Guide

## 1. Filosofia de Design

Nossa UI/UX é guiada por três princípios fundamentais:

*   **Clareza e Foco:** A interface deve ser limpa, moderna e sem distrações. O objetivo é permitir que o usuário execute tarefas de gestão complexas da forma mais rápida e intuitiva possível. A informação mais importante deve ser sempre a mais proeminente.
*   **Consistência:** Utilizamos um sistema de componentes padronizado (baseado em **ShadCN UI** e **Tailwind CSS**) para garantir uma experiência de usuário coesa e previsível em toda a aplicação. Um botão de "Salvar" ou um card de estatísticas deve ter a mesma aparência e comportamento em qualquer tela.
*   **Feedback Imediato:** O sistema deve comunicar claramente seu estado ao usuário. Ações devem ser confirmadas com notificações (`Toast`), operações demoradas devem exibir loaders (`Loader2`, `Skeleton`), e ações destrutivas devem ser prevenidas com diálogos de confirmação (`AlertDialog`).

## 2. Paleta de Cores

A paleta de cores é definida em `src/app/globals.css` usando variáveis HSL para fácil customização.

*   **Primária (`--primary`):** Um tom de azul (HSL: `212.1 74.4% 69.8%`) usado para ações principais, botões de confirmação, links e para destacar elementos importantes nos gráficos.
*   **Secundária (`--secondary`):** Cinza claro (HSL: `240 4.8% 92.9%`) usado para fundos de seções, itens de menu e elementos de suporte que não precisam de destaque.
*   **Fundo (`--background`):** Um tom de cinza muito claro, quase branco (HSL: `240 5.3% 95.9%`), para o fundo principal da aplicação.
*   **Cards (`--card`):** Branco (HSL: `0 0% 100%`), usado como contêiner principal para conteúdo, garantindo alto contraste e legibilidade.
*   **Destrutiva (`--destructive`):** Vermelho (HSL: `0 84.2% 60.2%`) reservado para ações perigosas, como exclusão, cancelamento e alertas de erro críticos.
*   **Acento (`--accent`):** Amarelo/Dourado (HSL: `52.2 73.3% 68.2%`) usado para destacar notificações importantes (como os alertas no dashboard) e como cor secundária em gráficos.

## 3. Tipografia

Utilizamos duas fontes principais para criar uma hierarquia visual clara:

*   **Poppins (`font-headline`):** Usada para títulos principais e valores de destaque (como os totais nos cards de estatísticas). Sua aparência mais arredondada e forte chama a atenção.
*   **Inter (`font-body`):** Usada para todo o resto — texto de corpo, descrições, labels de formulário, e menus. É uma fonte extremamente legível, otimizada para interfaces.

## 4. Layout e Espaçamento

*   **Estrutura Principal:** O layout é composto por uma **Sidebar** (menu lateral) e uma área de conteúdo principal (**SidebarInset**). A navegação principal é sempre visível, permitindo acesso rápido a todas as áreas do sistema.
*   **Grades e Espaçamento:** As páginas são estruturadas com Flexbox e Grid do Tailwind CSS, usando um espaçamento consistente (`gap-6`) entre os elementos principais. O espaçamento interno dos componentes (como o `p-6` dos cards) segue a escala padrão do Tailwind, garantindo ritmo e previsibilidade visual.

## 5. Componentes Essenciais (ShadCN UI)

*   **Card (`<Card>`):** O principal contêiner de conteúdo. Possui cantos arredondados (`rounded-2xl`), sombra sutil (`shadow-sm`) e fundo branco para destacar a informação.
*   **Button (`<Button>`):**
    *   **Primário (padrão):** Ações principais (Salvar, Adicionar).
    *   **Destrutivo:** Ações perigosas (Excluir).
    *   **Outline/Ghost:** Ações secundárias (Cancelar, Editar).
    *   **Arredondamento:** Botões de ação rápida (como "Adicionar") usam `rounded-full`, enquanto botões padrão usam `rounded-md`.
*   **Diálogos e Alertas (`<Dialog>`, `<AlertDialog>`):**
    *   **Dialog:** Usado para formulários de adição e edição, mantendo o usuário no contexto da página atual.
    *   **AlertDialog:** Reservado para confirmar ações críticas e irreversíveis.
*   **Tabelas (`<Table>`):** Usadas para exibir listas de dados. A linha tem um efeito `hover` sutil, e ações são agrupadas em um `DropdownMenu` (`...`) para manter a interface limpa.
*   **Formulários:** Construídos com `react-hook-form` e `zod` para validação, usando componentes como `<Input>`, `<Select>`, `<Textarea>` e `<Calendar>` para uma entrada de dados consistente.
*   **Badges (`<Badge>`):** Usados para exibir status (ex: "Pendente", "Pago", "Ativo") com cores que comunicam o significado rapidamente.

## 6. Iconografia

Utilizamos exclusivamente a biblioteca **`lucide-react`**. Seus ícones são leves, consistentes e minimalistas, complementando a estética limpa do design. Ícones são sempre usados com um propósito: reforçar uma ação, guiar o olhar ou representar um conceito de forma visual.

---

Ao desenvolver novas funcionalidades, siga estritamente este guia para manter a consistência, usabilidade e identidade visual da aplicação.
