# Alvorada - Migração de Firebase para MySQL (MariaDB)

Este projeto foi migrado de uma arquitetura client-side do Firebase (Auth e Firestore) para um banco de dados relacional **MySQL (MariaDB)** local ou hospedado, utilizando o **Prisma ORM** e **Next.js Server Actions**.

---

## 🚀 Como Configurar e Rodar o Projeto em Casa (VPS)

Siga estes passos para configurar e inicializar o sistema no seu ambiente:

### 1. Requisitos Prévios
* **Node.js** instalado na máquina/VPS (versão recomendada: LTS v20 ou superior).
* **MySQL** ou **MariaDB** instalado e rodando (no seu caso, hospedado na VPS e acessível).
* **HeidiSQL** (ou outro cliente MySQL) instalado no seu computador para gerenciar o banco de dados.

---

### 2. Configurando o Banco de Dados no HeidiSQL
1. Abra o **HeidiSQL**.
2. Crie uma nova conexão apontando para a sua **VPS** (IP da VPS, porta padrão `3306`, usuário e senha do banco).
3. Após conectar, clique com o botão direito na lista de bancos e selecione **Criar novo** -> **Banco de dados**.
4. Dê o nome de `alvorada` (ou o nome que preferir) e clique em OK.

---

### 3. Baixando o Código e Instalando Dependências
Abra o seu terminal na pasta do projeto e execute:

```bash
# 1. Puxe a versão mais recente do GitHub
git pull origin main

# 2. Instale todas as dependências necessárias
npm install
```

---

### 4. Configurando as Variáveis de Ambiente
Crie um arquivo chamado `.env` na raiz do projeto (ou edite o existente). Configure a variável `DATABASE_URL` com a string de conexão do seu banco de dados:

```env
# Formato: mysql://USUARIO:SENHA@IP_DA_VPS:PORTA/NOME_DO_BANCO
DATABASE_URL="mysql://root:sua_senha_do_banco@localhost:3306/alvorada"

# Chave API do Google Gemini (necessária para funcionalidades de Inteligência Artificial)
GOOGLE_GENAI_API_KEY="sua_chave_aqui"
```

*Nota: O arquivo `.env` está configurado no `.gitignore` e não será enviado para o GitHub por motivos de segurança.*

---

### 5. Executando as Migrações do Prisma
Este comando lê a modelagem declarada em `prisma/schema.prisma` e cria automaticamente todas as 13 tabelas necessárias no seu banco de dados MySQL/MariaDB:

```bash
npx prisma migrate dev --name init
```

*Você verá no HeidiSQL que todas as tabelas (User, Product, Customer, Sale, etc.) foram criadas imediatamente.*

---

### 6. Iniciando a Aplicação
Agora você já pode rodar o sistema:

* **Modo de Desenvolvimento:**
  ```bash
  npm run dev
  ```
  A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

* **Modo de Produção:**
  ```bash
  npm run build
  ```
  ```bash
  npm start
  ```

---

## 🔑 Credenciais do Primeiro Acesso (Seed Automático)

Na primeira inicialização do projeto, o sistema detectará que o banco de dados está vazio e executará uma função de semeadura automática (**Seed**). Ela cria os produtos e fornecedores de teste, e também cadastra o primeiro usuário Administrador do sistema:

* **E-mail:** `admin@alvorada.com`
* **Senha padrão:** `123456`

> 💡 *Após realizar o primeiro login, recomenda-se criar novos operadores de caixa e gerentes através do painel de controle e redefinir a senha do administrador se necessário.*
