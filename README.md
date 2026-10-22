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

## Como rodar no seu computador (Windows)

1. Instale o **Node.js** (versão LTS) em https://nodejs.org — avance com as
   opções padrão do instalador.
2. **Feche e abra de novo** o Prompt de Comando (cmd) e confira:
   ```
   node -v
   ```
3. Entre na pasta do sistema e rode, uma única vez:
   ```
   npm install
   npm run setup
   ```
   O `setup` cria o arquivo `.env`, o banco local (`prisma/dev.db`) e o usuário inicial.
4. Para usar o sistema, rode:
   ```
   npm run dev
   ```
   e acesse http://localhost:3000 no navegador. Deixe a janela do cmd aberta
   enquanto usa; para parar, aperte `Ctrl + C`.

Login inicial:

- **E-mail:** `admin@autoescola.local`
- **Senha:** `admin123`

Para criar o usuário inicial com outro e-mail/senha, defina `ADMIN_EMAIL` e
`ADMIN_SENHA` antes de rodar `npm run setup`.

### Ao baixar uma versão nova

```
npm install
npm run db:migrate
```

## Tecnologia

- Next.js 15 (App Router, Server Actions) + TypeScript
- Tailwind CSS
- Prisma + SQLite (banco local). Para usar PostgreSQL/Supabase, troque o
  `provider` em `prisma/schema.prisma` e a `DATABASE_URL` no `.env`.

Comandos úteis: `npm run db:studio` abre uma interface para ver/editar o banco.
