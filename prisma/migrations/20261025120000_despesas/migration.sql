-- CreateTable
CREATE TABLE "Despesa" (
    "id" SERIAL NOT NULL,
    "autoescolaId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "favorecido" TEXT,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "forma" TEXT,
    "veiculoId" INTEGER,
    "litrosCent" INTEGER,
    "km" INTEGER,
    "obs" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Despesa_autoescolaId_vencimento_idx" ON "Despesa"("autoescolaId", "vencimento");

-- CreateIndex
CREATE INDEX "Despesa_autoescolaId_pagoEm_idx" ON "Despesa"("autoescolaId", "pagoEm");

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Bloqueia a API REST pública do Supabase também na tabela nova.
ALTER TABLE "Despesa" ENABLE ROW LEVEL SECURITY;
