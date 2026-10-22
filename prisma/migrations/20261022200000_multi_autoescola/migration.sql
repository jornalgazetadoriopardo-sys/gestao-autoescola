-- Várias autoescolas no mesmo sistema.
-- Os dados que já existem passam a pertencer à autoescola nº 1.

-- CreateTable
CREATE TABLE "Autoescola" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Autoescola_pkey" PRIMARY KEY ("id")
);

-- Autoescola nº 1, com o nome que já estava nas configurações.
INSERT INTO "Autoescola" ("id", "nome")
SELECT 1, COALESCE((SELECT "nome" FROM "Configuracao" WHERE "id" = 1), 'Minha Autoescola');
SELECT setval(pg_get_serial_sequence('"Autoescola"', 'id'), (SELECT MAX("id") FROM "Autoescola"));

-- Vincula os registros existentes à autoescola nº 1 (o DEFAULT só existe durante a migração).
ALTER TABLE "Usuario" ADD COLUMN "autoescolaId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "superadmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Usuario" ALTER COLUMN "autoescolaId" DROP DEFAULT;

ALTER TABLE "Aluno" ADD COLUMN "autoescolaId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Aluno" ALTER COLUMN "autoescolaId" DROP DEFAULT;

ALTER TABLE "Instrutor" ADD COLUMN "autoescolaId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Instrutor" ALTER COLUMN "autoescolaId" DROP DEFAULT;

ALTER TABLE "Veiculo" ADD COLUMN "autoescolaId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Veiculo" ALTER COLUMN "autoescolaId" DROP DEFAULT;

-- O primeiro administrador já cadastrado vira o dono da plataforma.
UPDATE "Usuario" SET "superadmin" = true
WHERE "id" = (SELECT MIN("id") FROM "Usuario" WHERE "papel" = 'admin');

-- Configurações: id passa a ser o id da autoescola.
ALTER TABLE "Configuracao" ALTER COLUMN "id" DROP DEFAULT;

-- CPF e placa passam a ser únicos dentro de cada autoescola.
DROP INDEX "Aluno_cpf_key";
DROP INDEX "Veiculo_placa_key";
CREATE UNIQUE INDEX "Aluno_autoescolaId_cpf_key" ON "Aluno"("autoescolaId", "cpf");
CREATE UNIQUE INDEX "Veiculo_autoescolaId_placa_key" ON "Veiculo"("autoescolaId", "placa");

-- CreateIndex
CREATE INDEX "Instrutor_autoescolaId_idx" ON "Instrutor"("autoescolaId");
CREATE INDEX "Usuario_autoescolaId_idx" ON "Usuario"("autoescolaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Instrutor" ADD CONSTRAINT "Instrutor_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Configuracao" ADD CONSTRAINT "Configuracao_id_fkey" FOREIGN KEY ("id") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bloqueia a API REST pública do Supabase também na tabela nova.
ALTER TABLE "Autoescola" ENABLE ROW LEVEL SECURITY;
