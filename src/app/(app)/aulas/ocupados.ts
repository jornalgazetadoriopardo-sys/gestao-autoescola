"use server";

import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { intervaloDoDia } from "@/lib/aulas";
import { DURACAO_EXAME, instante, type Ocupado } from "@/lib/disponibilidade";
import { carregarFuncionamento } from "@/lib/feriados-servidor";

// O que já ocupa a agenda nos dias pedidos, para os formulários desabilitarem
// os horários: aulas (não canceladas), exames do Detran com horário marcado e
// o que está fora do horário de funcionamento (feriados, dias fechados, almoço). `ignorar` é a aula que está sendo editada.
export async function buscarOcupados(datas: string[], ignorar?: number, ignorarEtapa?: number): Promise<Ocupado[]> {
  await exigirSessao();
  const dias = [...new Set(datas.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(0, 120);
  if (dias.length === 0) return [];
  const periodo = dias.map((d) => {
    const { inicio, fim } = intervaloDoDia(d);
    return { inicio, fim };
  });

  const [aulas, exames, funcionamento] = await Promise.all([
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
    carregarFuncionamento(dias[0], dias[dias.length - 1]),
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

  // Fora do horário de funcionamento (dia fechado, antes de abrir, depois de fechar
  // e almoço): bloqueado, a não ser que a aula seja marcada como exceção.
  for (const d of dias) {
    const f = funcionamento(d);
    const bloco = (inicio: number, fim: number, descricao: string) =>
      ocupados.push({ id: 0, inicio, fim, instrutorId: null, veiculoId: null, alunoId: 0, tipo: "fechado", descricao });
    const dia = intervaloDoDia(d);
    if (!f.aberto) {
      bloco(dia.inicio.getTime(), dia.fim.getTime(), f.motivo);
      continue;
    }
    const fora = `fora do horário de funcionamento (${f.inicio} às ${f.fim})`;
    bloco(dia.inicio.getTime(), instante(d, f.inicio), fora);
    bloco(instante(d, f.fim), dia.fim.getTime(), fora);
    if (f.almoco) {
      bloco(
        instante(d, f.almoco.inicio),
        instante(d, f.almoco.fim),
        `horário de almoço (${f.almoco.inicio} às ${f.almoco.fim})`,
      );
    }
  }
  return ocupados;
}
