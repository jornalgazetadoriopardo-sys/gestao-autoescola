-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "alinhamentoTermica" TEXT NOT NULL DEFAULT 'esquerda',
ADD COLUMN     "larguraTermica" INTEGER NOT NULL DEFAULT 68,
ADD COLUMN     "obsGuiaTaxas" TEXT;

