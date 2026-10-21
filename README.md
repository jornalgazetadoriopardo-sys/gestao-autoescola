# Gestão Autoescola

Sistema web para os responsáveis da autoescola controlarem alunos, aulas,
presença e pagamentos.

## O que já funciona

- Login dos responsáveis (administrador / secretaria)
- Cadastro de **alunos** com busca por nome ou CPF, validação de CPF e ficha do aluno
- Cadastro de **instrutores** e **veículos**
- Painel com resumo

Próximas etapas: matrícula com parcelas, agenda de aulas com presença,
baixa de pagamentos e painel financeiro.

## Como rodar no seu computador

Requisito: [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
npm install
cp .env.example .env      # depois troque SESSION_SECRET por um valor aleatório
npm run setup             # cria o banco local (prisma/dev.db) e o usuário inicial
npm run dev
```

Acesse http://localhost:3000 e entre com:

- **E-mail:** `admin@autoescola.local`
- **Senha:** `admin123`

Para criar o usuário inicial com outro e-mail/senha, defina `ADMIN_EMAIL` e
`ADMIN_SENHA` antes de rodar `npm run setup`.

## Tecnologia

- Next.js 15 (App Router, Server Actions) + TypeScript
- Tailwind CSS
- Prisma + SQLite (banco local). Para usar PostgreSQL/Supabase, troque o
  `provider` em `prisma/schema.prisma` e a `DATABASE_URL` no `.env`.

Comandos úteis: `npm run db:studio` abre uma interface para ver/editar o banco.
