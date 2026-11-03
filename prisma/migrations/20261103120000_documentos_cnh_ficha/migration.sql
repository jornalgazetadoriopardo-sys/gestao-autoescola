-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "cnhEmissao" TIMESTAMP(3),
ADD COLUMN     "cnhValidade" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "formatoFicha" TEXT NOT NULL DEFAULT 'inteira';

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "categoriasCanceladas" JSONB;

-- CreateTable
CREATE TABLE "ModeloDocumento" (
    "id" SERIAL NOT NULL,
    "autoescolaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "arquivo" BYTEA NOT NULL,
    "nome" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeloDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModeloDocumento_autoescolaId_tipo_key" ON "ModeloDocumento"("autoescolaId", "tipo");

-- AddForeignKey
ALTER TABLE "ModeloDocumento" ADD CONSTRAINT "ModeloDocumento_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Bloqueia a API REST pública do Supabase também na tabela nova.
ALTER TABLE "ModeloDocumento" ENABLE ROW LEVEL SECURITY;
