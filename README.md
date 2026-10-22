# Gestão Autoescola

Sistema web para os responsáveis da autoescola controlarem alunos, aulas,
presença e pagamentos.

## O que já funciona

- **Início**: atalhos para as tarefas do dia, avisos (parcelas em atraso, parcelas
  que vencem hoje, lembretes de manutenção) e aulas de hoje com presença
- **Alunos**: cadastro, busca por nome/CPF e ficha com aulas, pagamentos e relatório
- **Matrícula** com forma de pagamento:
  - *Parcelado pela autoescola*: gera as parcelas (com juros ao mês opcional) e o
    **carnê para imprimir** (4 parcelas por folha A4, para recortar)
  - *Cartão*, *Pix* ou *dinheiro* à vista: a matrícula já fica quitada
- **Guia do aluno** gerado na matrícula (imprimir ou salvar em PDF): dados, pagamento,
  **cronograma** com um quadro por aula contratada (preenchido com as aulas agendadas
  ou em branco para anotar data e horário), orientações e assinaturas; botão para
  enviar o resumo pelo WhatsApp
- **Pagamentos**: parcelas atrasadas, a vencer e pagas; baixa com data, valor e
  forma de pagamento; **recibo** em A4 (via do aluno e via da autoescola)
- **Agenda de aulas** com bloqueio de conflito de horário, saldo de aulas e presença
  - Agendamento avulso (uma aula) ou **várias aulas de uma vez** pelo calendário,
    com horário por dia e preenchimento automático ("toda terça e quinta às 14h")
  - Cada aula pode ser **editada** (data, horário, instrutor, veículo...) ou excluída
- **Veículos** com histórico de manutenção e **lembretes** ("me lembrar no dia...")
  que aparecem na tela inicial 7 dias antes
- **Relatórios** para imprimir ou salvar em PDF: do aluno (aulas, presenças,
  faltas, quanto falta para concluir e pagamentos), financeiro e de aulas por período
- **Configurações**: dados e logotipo da autoescola (usados no menu, carnê, recibos
  e relatórios), usuários (administrador ou secretaria) e troca de senha

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

### Criar uma migração nova (desenvolvimento)

A migração que liga o RLS (`bloquear_api_publica`) depende da tabela
`_prisma_migrations`, então o `prisma migrate dev` não consegue recriar o
histórico num banco temporário. Para mudar o banco, edite `prisma/schema.prisma`
e gere o SQL comparando com o banco atual:

```
mkdir prisma/migrations/AAAAMMDDHHMMSS_nome
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/AAAAMMDDHHMMSS_nome/migration.sql
npx prisma migrate deploy
```

Em tabelas novas, acrescente `ALTER TABLE "Tabela" ENABLE ROW LEVEL SECURITY;`.
