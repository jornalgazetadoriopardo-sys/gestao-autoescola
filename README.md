# Gestão Autoescola

Sistema web para os responsáveis da autoescola controlarem alunos, aulas,
presença e pagamentos.

## O que já funciona

- Login dos responsáveis (administrador / secretaria)
- Cadastro de **alunos** com busca por nome ou CPF, validação de CPF e ficha do aluno
- Cadastro de **instrutores** e **veículos**
- **Matrícula** do aluno (categoria, aulas contratadas, valor) com geração
  automática das parcelas mensais e situação de cada parcela (pendente / atrasada / paga)
- **Juros ao mês** opcional no parcelamento (parcelas fixas pela Tabela Price)
- **Agenda de aulas** por dia e por instrutor, com bloqueio de conflito de horário
  (aluno, instrutor e veículo) e controle do saldo de aulas contratadas
- **Presença**: marcar presente, falta ou cancelar; progresso de aulas na ficha do aluno
- Painel com resumo

Próximas etapas: baixa de pagamentos, recibo e painel financeiro.

## Publicar na internet (Supabase + Vercel)

O sistema roda na **Vercel** e guarda os dados no **Supabase** (PostgreSQL).
Não é preciso instalar nada no computador.

### 1. Supabase (banco de dados)

1. Crie uma conta em https://supabase.com e clique em **New project**.
2. Dê um nome (ex.: `autoescola`), crie uma **senha do banco** (guarde-a) e
   escolha a região **South America (São Paulo)**.
3. Com o projeto criado, clique em **Connect** (no topo da página) e copie duas
   conexões, trocando `[YOUR-PASSWORD]` pela senha do banco:
   - **Transaction pooler** (porta `6543`) → será o `DATABASE_URL`.
     Acrescente no final: `?pgbouncer=true&connection_limit=1`
   - **Session pooler** (porta `5432`) → será o `DIRECT_URL`.

### 2. Vercel (sistema)

1. Crie uma conta em https://vercel.com entrando com o GitHub.
2. Clique em **Add New → Project** e importe o repositório `gestao-autoescola`.
3. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | conexão *Transaction pooler* (com `?pgbouncer=true&connection_limit=1`) |
   | `DIRECT_URL` | conexão *Session pooler* |
   | `SESSION_SECRET` | um texto aleatório longo (gere em https://generate-secret.vercel.app/32) |
   | `ADMIN_EMAIL` | seu e-mail, para o primeiro login |
   | `ADMIN_SENHA` | sua senha do primeiro login (mínimo 8 caracteres) |

4. Clique em **Deploy**. A cada publicação o banco é atualizado sozinho
   (`vercel-build` aplica as migrações e cria o primeiro usuário, se ainda não existir).
5. Ao terminar, a Vercel mostra o endereço do sistema (ex.: `gestao-autoescola.vercel.app`).

## Rodar no computador (desenvolvimento)

Requisitos: [Node.js](https://nodejs.org) 20+ e um banco PostgreSQL (pode ser
o próprio Supabase ou um PostgreSQL local).

```
npm install
npm run setup     # cria o .env; preencha DATABASE_URL e DIRECT_URL e rode de novo
npm run dev
```

Acesse http://localhost:3000. Sem `ADMIN_EMAIL`/`ADMIN_SENHA` no `.env`, o
usuário inicial local é `admin@autoescola.local` / `admin123`.

Depois de baixar uma versão nova: `npm install` e `npm run db:migrate`.

## Tecnologia

- Next.js 15 (App Router, Server Actions) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- Hospedagem na Vercel (região São Paulo)

Comandos úteis: `npm run db:studio` abre uma interface para ver/editar o banco.
