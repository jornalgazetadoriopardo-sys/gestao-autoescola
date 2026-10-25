-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "biometriaEm" TIMESTAMP(3),
ADD COLUMN     "localAtividade" TEXT,
ADD COLUMN     "mae" TEXT,
ADD COLUMN     "naturalidade" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "pai" TEXT,
ADD COLUMN     "registroCnh" TEXT,
ADD COLUMN     "renach" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "rgExpedicao" TIMESTAMP(3),
ADD COLUMN     "rgOrgao" TEXT,
ADD COLUMN     "rgUf" TEXT,
ADD COLUMN     "telefone2" TEXT;

-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "taxasPadrao" JSONB;

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "cursoTeorico" TEXT NOT NULL DEFAULT 'autoescola',
ADD COLUMN     "tipoProcesso" TEXT NOT NULL DEFAULT 'primeira';

-- CreateTable
CREATE TABLE "Etapa" (
    "id" SERIAL NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "data" TIMESTAMP(3),
    "resultado" TEXT,
    "valorCentavos" INTEGER,
    "cobranca" TEXT NOT NULL DEFAULT 'aluno',
    "pagoEm" TIMESTAMP(3),
    "forma" TEXT,
    "obs" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Etapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Etapa_matriculaId_idx" ON "Etapa"("matriculaId");

-- CreateIndex
CREATE INDEX "Etapa_data_idx" ON "Etapa"("data");

-- AddForeignKey
ALTER TABLE "Etapa" ADD CONSTRAINT "Etapa_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Bloqueia a API REST pública do Supabase também na tabela nova.
ALTER TABLE "Etapa" ENABLE ROW LEVEL SECURITY;
