-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "calendarioLicenciamento" JSONB;

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "entradaCentavos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "entradaForma" TEXT;

-- AlterTable
ALTER TABLE "Veiculo" ADD COLUMN     "licenciamentoPagoAno" INTEGER,
ADD COLUMN     "tipoLicenciamento" TEXT NOT NULL DEFAULT 'leve';


-- Caminhões e carretas (categorias C e E) seguem o calendário de veículos pesados.
UPDATE "Veiculo" SET "tipoLicenciamento" = 'pesado' WHERE "categoria" IN ('C', 'E');
