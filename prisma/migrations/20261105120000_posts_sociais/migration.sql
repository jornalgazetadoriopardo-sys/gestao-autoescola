-- CreateTable
CREATE TABLE "PostSocial" (
    "id" SERIAL NOT NULL,
    "autoescolaId" INTEGER NOT NULL,
    "modelo" TEXT NOT NULL,
    "formato" TEXT NOT NULL DEFAULT 'feed',
    "titulo" TEXT NOT NULL,
    "legenda" TEXT NOT NULL,
    "imagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostSocial_autoescolaId_criadoEm_idx" ON "PostSocial"("autoescolaId", "criadoEm");

-- AddForeignKey
ALTER TABLE "PostSocial" ADD CONSTRAINT "PostSocial_autoescolaId_fkey" FOREIGN KEY ("autoescolaId") REFERENCES "Autoescola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Bloqueia a API REST pública do Supabase também na tabela nova.
ALTER TABLE "PostSocial" ENABLE ROW LEVEL SECURITY;
