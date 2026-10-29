import "server-only";
import { db } from "./db";
import { praticasPorCategoria } from "./aulas";

export type ProntoParaExame = {
  chave: string;
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
// têm a prova prática marcada (sem data, ou nem cadastrada). Em matrículas de
// duas categorias (ex.: AB) cada categoria é conferida separada: quem terminou
// as aulas de moto já pode marcar a prova da A. Quem já passou não entra.
export async function prontosParaExamePratico(alunoId?: number): Promise<ProntoParaExame[]> {
  const matriculas = await db.matricula.findMany({
    where: { aluno: { status: "ativo", ...(alunoId ? { id: alunoId } : {}) }, qtdPraticas: { gt: 0 } },
    select: {
      id: true,
      categoria: true,
      qtdPraticas: true,
      praticasPorCategoria: true,
      aluno: { select: { id: true, nome: true } },
      etapas: { where: { tipo: "exame_pratico" }, orderBy: { ordem: "asc" } },
      aulas: { where: { tipo: "pratica", status: "presente" }, select: { categoria: true } },
    },
    orderBy: { aluno: { nome: "asc" } },
  });

  const prontos: ProntoParaExame[] = [];
  for (const m of matriculas) {
    const mapa = praticasPorCategoria(m);
    // Sem a divisão por categoria (matrícula antiga AB): confere pelo total.
    const grupos = mapa
      ? Object.entries(mapa)
          .filter(([, n]) => n > 0)
          .map(([letra, contratadas]) => ({
            letra,
            contratadas,
            feitas: Object.keys(mapa).length > 1 ? m.aulas.filter((a) => a.categoria === letra).length : m.aulas.length,
          }))
      : [{ letra: null, contratadas: m.qtdPraticas, feitas: m.aulas.length }];

    for (const g of grupos) {
      if (g.feitas < g.contratadas) continue;
      const provas = g.letra ? m.etapas.filter((e) => !e.categoria || e.categoria === g.letra) : m.etapas;
      if (provas.some((e) => e.resultado === "ok")) continue;
      const semData = provas.find((e) => e.resultado === null && !e.data);
      if (!semData && provas.length > 0) continue;
      const letra = g.letra ?? m.categoria.slice(-1);
      prontos.push({
        chave: `${m.id}-${letra}`,
        matriculaId: m.id,
        alunoId: m.aluno.id,
        alunoNome: m.aluno.nome,
        categoria: g.letra ?? m.categoria,
        praticas: g.feitas,
        prova: semData?.descricao ?? `Exame prático – categoria ${letra}`,
        agendar: semData
          ? `/exames/${semData.id}/editar`
          : `/exames/nova?matricula=${m.id}&tipo=exame_pratico&categoria=${letra}`,
      });
    }
  }
  return prontos;
}
