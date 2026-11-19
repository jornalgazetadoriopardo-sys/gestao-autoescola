-- AlterTable
ALTER TABLE "Autoescola" ADD COLUMN     "avaliacaoAte" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlataformaConfig" ADD COLUMN     "diasAvaliacao" INTEGER NOT NULL DEFAULT 3;

