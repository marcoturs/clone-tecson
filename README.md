# Clone TecSon

Sistema de gestão comercial (mini-ERP) construído com React + Vite, Tailwind CSS e Supabase. Inclui login, dashboard, e cadastro/gestão de produtos, clientes, fornecedores, vendedores, vendas, histórico, financeiro e relatórios.

> Projeto pessoal/educacional inspirado no TecSon, sem qualquer afiliação, endosso ou vínculo oficial com o produto ou empresa originais.

## Stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (autenticação e banco de dados)
- [Radix UI](https://www.radix-ui.com/) + [lucide-react](https://lucide.dev/) para componentes/ícones
- [Recharts](https://recharts.org/) para gráficos

## Pré-requisitos

- Node.js 18+
- Uma conta e projeto no [Supabase](https://supabase.com/)

## Configuração

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/marcoturs/clone-tecson.git
   cd clone-tecson
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente de exemplo e preencha com as credenciais do seu projeto Supabase (disponíveis em **Project Settings > API**):

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_KEY=sua-chave-publishable
   ```

3. Rode o projeto em modo desenvolvimento:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — inicia o servidor de desenvolvimento
- `npm run build` — gera a build de produção
- `npm run preview` — pré-visualiza a build de produção
- `npm run lint` — roda o ESLint

## Licença

Distribuído sob a licença [MIT](LICENSE).
