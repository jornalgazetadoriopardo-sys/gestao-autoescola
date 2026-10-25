import "server-only";
import { db } from "./db";

export type ProntoParaExame = {
  matriculaId: number;
  alunoId: number;
  alunoNome: string;
  categoria: string;
  praticas: number;
  // Link para marcar a prova: a prova pendente (sem data) ou uma nova.
  agendar: string;
  prova: string;
};

// Alunos ativos que já fizeram todas as aulas práticas contratadas e ainda não
// têm a prova prática marcada (sem data, ou nem cadastrada). Quem já passou em
// todas as provas práticas não entra.
export async function prontosParaExamePratico(alunoId?: number): Promise<ProntoParaExame[]> {
  const matriculas = await db.matricula.findMany({
    where: { aluno: { status: "ativo", ...(alunoId ? { id: alunoId } : {}) }, qtdPraticas: { gt: 0 } },
    select: {
      id: true,
      categoria: true,
      qtdPraticas: true,
      aluno: { select: { id: true, nome: true } },
      etapas: { where: { tipo: "exame_pratico" }, orderBy: { ordem: "asc" } },
      _count: { select: { aulas: { where: { tipo: "pratica", status: "presente" } } } },
    },
    orderBy: { aluno: { nome: "asc" } },
  });

  const prontos: ProntoParaExame[] = [];
  for (const m of matriculas) {
    if (m._count.aulas < m.qtdPraticas) continue;
    const semData = m.etapas.find((e) => e.resultado === null && !e.data);
    if (!semData && m.etapas.length > 0) continue;
    prontos.push({
      matriculaId: m.id,
      alunoId: m.aluno.id,
      alunoNome: m.aluno.nome,
      categoria: m.categoria,
      praticas: m._count.aulas,
      prova: semData?.descricao ?? "Exame prático",
      agendar: semData
        ? `/exames/${semData.id}/editar`
        : `/exames/nova?matricula=${m.id}&tipo=exame_pratico&categoria=${m.categoria.slice(-1)}`,
    });
  }
  return prontos;
}
