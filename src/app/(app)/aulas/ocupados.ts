"use server";

import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { intervaloDoDia } from "@/lib/aulas";
import type { Ocupado } from "@/lib/disponibilidade";

// Aulas já marcadas (não canceladas) nos dias pedidos, para os formulários
// desabilitarem os horários ocupados. `ignorar` é a aula que está sendo editada.
export async function buscarOcupados(datas: string[], ignorar?: number): Promise<Ocupado[]> {
  await exigirSessao();
  const dias = [...new Set(datas.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(0, 120);
  if (dias.length === 0) return [];

  const aulas = await db.aula.findMany({
    where: {
      status: { not: "cancelada" },
      ...(ignorar ? { id: { not: ignorar } } : {}),
      OR: dias.map((d) => {
        const { inicio, fim } = intervaloDoDia(d);
        return { dataHora: { gte: inicio, lt: fim } };
      }),
    },
    include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
  });

  return aulas.map((a) => ({
    id: a.id,
    inicio: a.dataHora.getTime(),
    fim: a.dataHora.getTime() + a.duracaoMin * 60_000,
    instrutorId: a.instrutorId,
    veiculoId: a.veiculoId,
    alunoId: a.matricula.alunoId,
    tipo: a.tipo,
    descricao: [
      a.matricula.aluno.nome.split(" ")[0],
      a.instrutor && `com ${a.instrutor.nome.split(" ")[0]}`,
      a.veiculo && `· ${a.veiculo.placa}`,
    ]
      .filter(Boolean)
      .join(" "),
  }));
}
