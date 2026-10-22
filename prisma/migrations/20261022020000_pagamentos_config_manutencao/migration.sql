-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "formaPagamento" TEXT NOT NULL DEFAULT 'carne';

-- AlterTable
ALTER TABLE "Parcela" ADD COLUMN     "obs" TEXT;

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3),
    "km" INTEGER,
    "valorCentavos" INTEGER,
    "lembrarEm" TIMESTAMP(3),
    "lembreteConcluido" BOOLEAN NOT NULL DEFAULT false,
    "obs" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nome" TEXT NOT NULL DEFAULT 'Minha Autoescola',
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "chavePix" TEXT,
    "avisoCarne" TEXT,
    "logo" TEXT,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Manutencao_lembrarEm_idx" ON "Manutencao"("lembrarEm");

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Bloqueia a API REST pública do Supabase também nas tabelas novas.
ALTER TABLE "Manutencao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Configuracao" ENABLE ROW LEVEL SECURITY;
