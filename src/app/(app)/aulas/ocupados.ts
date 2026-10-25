"use server";

import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { intervaloDoDia } from "@/lib/aulas";
import { DURACAO_EXAME, instante, type Ocupado } from "@/lib/disponibilidade";
import { carregarFeriados } from "@/lib/feriados-servidor";

// O que já ocupa a agenda nos dias pedidos, para os formulários desabilitarem
// os horários: aulas (não canceladas), exames do Detran com horário marcado e
// feriados (o dia inteiro). `ignorar` é a aula que está sendo editada.
export async function buscarOcupados(datas: string[], ignorar?: number, ignorarEtapa?: number): Promise<Ocupado[]> {
  await exigirSessao();
  const dias = [...new Set(datas.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(0, 120);
  if (dias.length === 0) return [];
  const periodo = dias.map((d) => {
    const { inicio, fim } = intervaloDoDia(d);
    return { inicio, fim };
  });

  const [aulas, exames, feriados] = await Promise.all([
    db.aula.findMany({
      where: {
        status: { not: "cancelada" },
        ...(ignorar ? { id: { not: ignorar } } : {}),
        OR: periodo.map(({ inicio, fim }) => ({ dataHora: { gte: inicio, lt: fim } })),
      },
      include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
    }),
    db.etapa.findMany({
      where: {
        hora: { not: null },
        resultado: null,
        ...(ignorarEtapa ? { id: { not: ignorarEtapa } } : {}),
        data: { in: dias.map((d) => new Date(`${d}T00:00:00Z`)) },
      },
      include: { matricula: { include: { aluno: true } } },
    }),
    carregarFeriados(dias[0], dias[dias.length - 1]),
  ]);

  const ocupados: Ocupado[] = aulas.map((a) => ({
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

  for (const e of exames) {
    const inicio = instante(e.data!.toISOString().slice(0, 10), e.hora!);
    ocupados.push({
      id: -e.id,
      inicio,
      fim: inicio + DURACAO_EXAME * 60_000,
      instrutorId: e.instrutorId,
      veiculoId: e.veiculoId,
      alunoId: e.matricula.alunoId,
      tipo: "exame",
      descricao: `${e.descricao} de ${e.matricula.aluno.nome.split(" ")[0]}`,
    });
  }

  for (const d of dias) {
    const nome = feriados.get(d);
    if (!nome) continue;
    const { inicio, fim } = intervaloDoDia(d);
    ocupados.push({
      id: 0,
      inicio: inicio.getTime(),
      fim: fim.getTime(),
      instrutorId: null,
      veiculoId: null,
      alunoId: 0,
      tipo: "feriado",
      descricao: nome,
    });
  }
  return ocupados;
}
