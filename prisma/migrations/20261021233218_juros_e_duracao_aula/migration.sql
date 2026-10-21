-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matriculaId" INTEGER NOT NULL,
    "instrutorId" INTEGER,
    "veiculoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "dataHora" DATETIME NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "obs" TEXT,
    CONSTRAINT "Aula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aula_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "Instrutor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aula_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Aula" ("dataHora", "id", "instrutorId", "matriculaId", "obs", "status", "tipo", "veiculoId") SELECT "dataHora", "id", "instrutorId", "matriculaId", "obs", "status", "tipo", "veiculoId" FROM "Aula";
DROP TABLE "Aula";
ALTER TABLE "new_Aula" RENAME TO "Aula";
CREATE INDEX "Aula_dataHora_idx" ON "Aula"("dataHora");
CREATE TABLE "new_Matricula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "qtdPraticas" INTEGER NOT NULL,
    "qtdTeoricas" INTEGER NOT NULL,
    "valorTotalCentavos" INTEGER NOT NULL,
    "jurosMesBp" INTEGER NOT NULL DEFAULT 0,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Matricula" ("alunoId", "categoria", "data", "id", "qtdPraticas", "qtdTeoricas", "valorTotalCentavos") SELECT "alunoId", "categoria", "data", "id", "qtdPraticas", "qtdTeoricas", "valorTotalCentavos" FROM "Matricula";
DROP TABLE "Matricula";
ALTER TABLE "new_Matricula" RENAME TO "Matricula";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
