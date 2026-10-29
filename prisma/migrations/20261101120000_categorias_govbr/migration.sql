-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "govbrNivel" TEXT,
ADD COLUMN     "govbrObs" TEXT,
ADD COLUMN     "govbrSenha" TEXT;

-- AlterTable
ALTER TABLE "Aula" ADD COLUMN     "categoria" TEXT;

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "praticasPorCategoria" JSONB;


-- Aulas práticas já marcadas: a categoria é a do veículo.
UPDATE "Aula" a SET "categoria" = v."categoria"
FROM "Veiculo" v
WHERE a."veiculoId" = v."id" AND a."tipo" = 'pratica';
