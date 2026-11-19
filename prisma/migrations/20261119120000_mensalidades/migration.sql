-- AlterTable
ALTER TABLE "Autoescola" ADD COLUMN     "cobrancaInicio" TIMESTAMP(3),
ADD COLUMN     "diaVencimento" INTEGER,
ADD COLUMN     "formaCobranca" TEXT,
ADD COLUMN     "isenta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mensalidadeCentavos" INTEGER;

-- CreateTable
CREATE TABLE "PlataformaConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "mensalidadeCentavos" INTEGER,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "formaPadrao" TEXT NOT NULL DEFAULT 'pix',
    "chavePix" TEXT,
    "nomeRecebedor" TEXT,
    "cidadeRecebedor" TEXT,
    "instrucoes" TEXT,
    "bloquearAutomatico" BOOLEAN NOT NULL DEFAULT true,
    "whatsappCobranca" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlataformaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensalidade" (
    "id" SERIAL NOT NULL,
    "autoescolaId" INTEGER NOT NULL,
    "competencia" TEXT NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "forma" TEXT NOT NULL DEFAULT 'pix',
    "pagoEm" TIMESTAMP(3),
    "informadoEm" TIMESTAMP(3),
    "comprovante" TEXT,
    "comprovanteNome" TEXT,
    "obs" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensalidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mensalidade_autoescolaId_competencia_key" ON "Mensalidade"("autoescolaId", "competencia");

-- AddForeignKey
ALTER TABLE "Mensalidade" ADD CONSTRAINT "Mensalidade_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Bloqueia a API REST pública do Supabase também nas tabelas novas.
ALTER TABLE "PlataformaConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mensalidade" ENABLE ROW LEVEL SECURITY;

-- A autoescola do dono do sistema não paga mensalidade.
UPDATE "Autoescola" SET "isenta" = true
WHERE "id" IN (SELECT "autoescolaId" FROM "Usuario" WHERE "superadmin" = true);
