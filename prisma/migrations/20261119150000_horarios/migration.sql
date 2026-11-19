-- AlterTable
ALTER TABLE "Aula" ADD COLUMN     "excecao" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "horarios" JSONB;

-- CreateTable
CREATE TABLE "DiaEspecial" (
    "id" SERIAL NOT NULL,
    "autoescolaId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "inicio" TEXT NOT NULL,
    "fim" TEXT NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaEspecial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiaEspecial_autoescolaId_idx" ON "DiaEspecial"("autoescolaId");

-- AddForeignKey
ALTER TABLE "DiaEspecial" ADD CONSTRAINT "DiaEspecial_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "DiaEspecial" ENABLE ROW LEVEL SECURITY;
