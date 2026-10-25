-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "contratoArquivo" BYTEA,
ADD COLUMN     "contratoEm" TIMESTAMP(3),
ADD COLUMN     "contratoNome" TEXT,
ADD COLUMN     "impressoraRecibo" TEXT NOT NULL DEFAULT 'a4';

