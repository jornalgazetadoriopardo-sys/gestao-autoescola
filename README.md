# Gestão Autoescola

Sistema web para os responsáveis da autoescola controlarem alunos, aulas,
presença e pagamentos.

## O que já funciona

- **Início**: atalhos para as tarefas do dia, avisos (parcelas em atraso, parcelas
  que vencem hoje, lembretes de manutenção) e aulas de hoje com presença
- **Alunos**: cadastro com **foto** (arquivo do computador/celular ou câmera do PC), busca por
  nome/CPF e ficha com aulas, pagamentos e relatório
- **Tudo pode ser alterado ou excluído**: aluno (com matrículas, aulas e pagamentos), matrícula,
  parcela (inclusive a baixa já feita) e acrescentar parcela, aula (também com presença; aula
  cancelada pode ser reativada), instrutor, veículo, manutenção, despesa, usuário e, na
  Plataforma, autoescola suspensa (digitando o nome para confirmar)
- **Processo de habilitação** (regras de 2025/2026): na matrícula, o tipo (1ª habilitação, adição,
  mudança de categoria ou reabilitação) e o curso teórico (na autoescola, online grátis pelo app
  CNH do Brasil ou não precisa). A lista de **exames e taxas** do aluno é criada sozinha: exame
  médico, psicológico, toxicológico (1ª habilitação e categorias C, D, E), biometria, curso online,
  prova teórica, prova prática de cada categoria e emissão da CNH, com os valores de
  Configurações > Taxas e exames. Cada item tem data, resultado (aprovado/reprovado, apto/inapto),
  valor e quem paga (aluno direto ou autoescola cobra, com recebimento e recibo). Reprovou na
  prova: a nova tentativa entra sozinha com a taxa de reexame. Tela **Exames e taxas** com os
  exames agendados, os resultados pendentes, o que falta marcar e as taxas a receber
- **Ficha do aluno** para imprimir (A4), no lugar da ficha de papel: dados, filiação, RG, RENACH,
  foto, pagamento e andamento dos exames
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
  - Agendamento avulso (uma aula) ou **várias aulas de uma vez** pelo calendário
    (cada aula com o seu instrutor e veículo),
    com horário por dia e preenchimento automático ("toda terça e quinta às 14h")
  - Os horários **ocupados ficam desabilitados** (aluno, instrutor ou veículo já em aula,
    ou horário que já passou), dentro do expediente definido em Configurações
  - Cada aula pode ser **editada** (data, horário, instrutor, veículo...) ou excluída
- **Despesas** (só administrador): folha de pagamento, vales, abastecimento (com veículo,
  litros e km), retirada do dono, aluguel, contas, impostos e outras
  - Cada despesa pode estar *paga* ou *a pagar* (com vencimento); botão para pagar depois
  - "Repetir todo mês" para salário, aluguel e contas fixas
  - Avisos na tela inicial de contas atrasadas ou que vencem nos próximos 3 dias
  - As manutenções com valor, lançadas em Veículos, também contam como despesa nos relatórios
- **Veículos** com histórico de manutenção e **lembretes** ("me lembrar no dia...")
  que aparecem na tela inicial 7 dias antes
- **Relatórios** para imprimir ou salvar em PDF: do aluno (aulas, presenças,
  faltas, quanto falta para concluir e pagamentos), financeiro (para o administrador:
  entradas, despesas, lucro, retiradas e sobra no caixa), despesas por tipo e por pessoa,
  resumo do ano mês a mês e aulas por período
- **Impressora térmica** (ex.: Elgin i9, bobina 80 mm): recibo (1 ou 2 vias) e carnê (um cupom
  por parcela) saem em cupom; escolha o padrão em Configurações > Impressora e troque entre A4 e
  térmica na própria tela de impressão. Guia do aluno, relatórios e contrato continuam em A4
- **Contrato**: cada autoescola envia o seu contrato em Word (.docx) com marcações como
  `{{aluno_nome}}`; na ficha do aluno, o botão Contrato baixa o arquivo preenchido (lista de
  marcações e um exemplo em Configurações > Contrato)
- **Configurações**: dados e logotipo da autoescola (usados no menu, carnê, recibos
  e relatórios), usuários (administrador ou secretaria) e troca de senha
- **Várias autoescolas** no mesmo sistema: cada usuário pertence a uma autoescola e
  só vê os dados dela (alunos, aulas, pagamentos, veículos, instrutores, configurações).
  CPF e placa podem se repetir entre autoescolas diferentes
- **Plataforma** (só para o dono do sistema): cria autoescolas com o primeiro
  administrador, mostra quantos usuários e alunos cada uma tem e suspende ou reativa
  o acesso (os dados continuam guardados)
- **Exportar e importar autoescola** (Plataforma): baixa um arquivo `.json` com todos os
  dados de uma autoescola (alunos, matrículas, parcelas, aulas, veículos, manutenções,
  instrutores, configurações e usuários com as senhas) e, em outro servidor, cria a
  autoescola de novo a partir dele. Serve para mudar de servidor sem perder nada

### Mudar de servidor

1. No servidor antigo, entre como dono da plataforma, abra **Plataforma** e clique em
   **Exportar** em cada autoescola. Guarde os arquivos em lugar seguro: eles têm dados
   pessoais dos alunos e as senhas (criptografadas) dos usuários.
2. No servidor novo, abra **Plataforma → Importar autoescola** e envie cada arquivo.
   Ou importa tudo, ou nada. Os usuários entram com o mesmo e-mail e a mesma senha.
3. Se um e-mail do arquivo já existir no servidor novo (por exemplo, o seu, criado por
   `ADMIN_EMAIL`), a importação é recusada e mostra quais são. Use outro `ADMIN_EMAIL`
   no servidor novo ou troque o e-mail desse usuário antes.

### Como a separação entre autoescolas funciona

Todo acesso ao banco passa por `db` (`src/lib/db.ts`), que pega a autoescola da
sessão e acrescenta o filtro dela em toda consulta, preenche a autoescola em todo
cadastro e confere se aluno, matrícula, instrutor e veículo usados num cadastro são
da mesma autoescola. Uma tabela nova sem regra de autoescola é recusada. A cada
requisição o sistema também confere se o usuário e a autoescola continuam ativos.
`dbGlobal` (sem filtro) só é usado no login e no painel da Plataforma.

O primeiro administrador criado (`ADMIN_EMAIL`) é o dono da plataforma e fica na
autoescola nº 1. Quem já usava o sistema antes desta versão: os dados existentes
viraram a autoescola nº 1 e o primeiro administrador virou o dono da plataforma.

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
- Hospedagem na Vercel, na mesma região do banco (`vercel.json`). Hoje o banco do Supabase fica em West US (Oregon), por isso a região é `pdx1`. Se o banco mudar de região, mude também o `vercel.json`: cada tela faz várias consultas, e o sistema longe do banco fica lento

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

Em tabelas novas, acrescente `ALTER TABLE "Tabela" ENABLE ROW LEVEL SECURITY;`
e diga em `src/lib/db.ts` (`FILTRO`) a qual autoescola cada registro pertence.
