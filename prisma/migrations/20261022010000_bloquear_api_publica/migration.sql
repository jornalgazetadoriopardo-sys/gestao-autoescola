-- O Supabase expõe as tabelas do schema "public" pela sua API REST.
-- Ligar o RLS sem nenhuma política bloqueia esse acesso; o sistema não é
-- afetado porque conecta como dono das tabelas, que ignora o RLS.
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Aluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Instrutor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Veiculo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Matricula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Aula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Parcela" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
