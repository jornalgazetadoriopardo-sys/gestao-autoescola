-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "feriadosIgnorados" JSONB;

-- AlterTable
ALTER TABLE "Etapa" ADD COLUMN     "hora" TEXT,
ADD COLUMN     "instrutorId" INTEGER,
ADD COLUMN     "local" TEXT,
ADD COLUMN     "veiculoId" INTEGER;

-- CreateTable
CREATE TABLE "Feriado" (
    "id" SERIAL NOT NULL,
    "autoescolaId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "nome" TEXT NOT NULL,
    "anual" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feriado_autoescolaId_idx" ON "Feriado"("autoescolaId");

-- AddForeignKey
ALTER TABLE "Etapa" ADD CONSTRAINT "Etapa_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etapa" ADD CONSTRAINT "Etapa_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "Instrutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feriado" ADD CONSTRAINT "Feriado_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Bloqueia a API REST pública do Supabase também na tabela nova.
ALTER TABLE "Feriado" ENABLE ROW LEVEL SECURITY;
