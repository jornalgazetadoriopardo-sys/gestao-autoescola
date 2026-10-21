-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'secretaria',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "nascimento" DATETIME,
    "endereco" TEXT,
    "categoria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Instrutor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "categorias" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "qtdPraticas" INTEGER NOT NULL,
    "qtdTeoricas" INTEGER NOT NULL,
    "valorTotalCentavos" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Aula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matriculaId" INTEGER NOT NULL,
    "instrutorId" INTEGER,
    "veiculoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "dataHora" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "obs" TEXT,
    CONSTRAINT "Aula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aula_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "Instrutor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aula_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matriculaId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "pagoEm" DATETIME,
    "valorPagoCentavos" INTEGER,
    "forma" TEXT,
    CONSTRAINT "Parcela_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_cpf_key" ON "Aluno"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE INDEX "Aula_dataHora_idx" ON "Aula"("dataHora");

-- CreateIndex
CREATE INDEX "Parcela_vencimento_idx" ON "Parcela"("vencimento");
