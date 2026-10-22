import "server-only";
import { db } from "./db";
import { fimDaAula, formatarDataHora, formatarHora, resumoAulas } from "./aulas";

export type NovaAula = {
  tipo: string;
  instrutorId: number;
  veiculoId: number | null;
  dataHora: Date;
  duracaoMin: number;
};

// Situações em que a aula ocupa o saldo contratado (falta e cancelamento não ocupam).
const CONSOME_SALDO = ["agendada", "presente"];

// Confere um grupo de aulas da mesma matrícula: aluno ativo, instrutor e veículo
// ativos e compatíveis, saldo de aulas contratadas e conflitos de horário (com as
// aulas já marcadas e entre as próprias aulas do grupo).
// `editando` indica a aula que está sendo alterada, para não conflitar consigo mesma.
// Devolve a mensagem de erro, ou null se estiver tudo certo.
export async function verificarAulas(
  matriculaId: number,
  aulas: NovaAula[],
  editando?: { id: number; status: string },
): Promise<string | null> {
  if (aulas.length === 0) return "Escolha ao menos uma data.";

  const matricula = await db.matricula.findUnique({
    where: { id: matriculaId },
    include: { aluno: true, aulas: { select: { id: true, tipo: true, status: true } } },
  });
  if (!matricula) return "Matrícula não encontrada.";
  if (matricula.aluno.status !== "ativo") return "O aluno não está ativo.";

  const ids = (lista: (number | null)[]) => [...new Set(lista.filter((x): x is number => x !== null))];
  const [instrutores, veiculos] = await Promise.all([
    db.instrutor.findMany({ where: { id: { in: ids(aulas.map((a) => a.instrutorId)) } } }),
    db.veiculo.findMany({ where: { id: { in: ids(aulas.map((a) => a.veiculoId)) } } }),
  ]);

  for (const a of aulas) {
    const instrutor = instrutores.find((i) => i.id === a.instrutorId);
    if (!instrutor?.ativo) return "Instrutor não encontrado ou inativo.";
    if (a.tipo === "pratica") {
      const veiculo = veiculos.find((v) => v.id === a.veiculoId);
      if (!veiculo?.ativo) return "Selecione um veículo ativo para a aula prática.";
      if (!matricula.categoria.includes(veiculo.categoria)) {
        return `O veículo é da categoria ${veiculo.categoria}, mas a matrícula é ${matricula.categoria}.`;
      }
      if (!instrutor.categorias.split(",").includes(veiculo.categoria)) {
        return `${instrutor.nome} não está cadastrado para ensinar a categoria ${veiculo.categoria}.`;
      }
    }
  }

  // Saldo: aulas agendadas e dadas ocupam o que foi contratado.
  const consome = !editando || CONSOME_SALDO.includes(editando.status);
  if (consome) {
    const resumo = resumoAulas(
      matricula,
      matricula.aulas.filter((a) => a.id !== editando?.id),
    );
    for (const tipo of ["pratica", "teorica"] as const) {
      const pedidas = aulas.filter((a) => a.tipo === tipo).length;
      const r = resumo[tipo];
      if (pedidas > r.restantes) {
        const nome = tipo === "pratica" ? "práticas" : "teóricas";
        return r.restantes === 0
          ? `Este aluno não tem mais aulas ${nome} disponíveis na matrícula (${r.feitas} feitas, ${r.agendadas} agendadas de ${r.contratadas}).`
          : `Você escolheu ${pedidas} aulas ${nome}, mas só restam ${r.restantes} para agendar nesta matrícula.`;
      }
    }
  }

  // Conflitos de horário: o mesmo aluno, instrutor ou veículo não pode estar em
  // duas aulas ao mesmo tempo. Exceção: aulas teóricas do mesmo instrutor no
  // mesmo horário são uma turma. Aula cancelada não ocupa horário.
  if (editando?.status === "cancelada") return null;

  const inicio = Math.min(...aulas.map((a) => a.dataHora.getTime()));
  const fim = Math.max(...aulas.map((a) => fimDaAula(a).getTime()));
  const existentes = await db.aula.findMany({
    where: {
      status: { not: "cancelada" },
      ...(editando ? { id: { not: editando.id } } : {}),
      dataHora: { gte: new Date(inicio - 4 * 60 * 60 * 1000), lt: new Date(fim) },
      OR: [
        { instrutorId: { in: ids(aulas.map((a) => a.instrutorId)) } },
        { veiculoId: { in: ids(aulas.map((a) => a.veiculoId)) } },
        { matricula: { alunoId: matricula.alunoId } },
      ],
    },
    include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
  });

  type Ocupada = NovaAula & { alunoId: number; alunoNome: string; placa?: string; instrutorNome?: string };
  const ocupadas: Ocupada[] = existentes.map((e) => ({
    tipo: e.tipo,
    instrutorId: e.instrutorId ?? 0,
    veiculoId: e.veiculoId,
    dataHora: e.dataHora,
    duracaoMin: e.duracaoMin,
    alunoId: e.matricula.alunoId,
    alunoNome: e.matricula.aluno.nome,
    placa: e.veiculo?.placa,
    instrutorNome: e.instrutor?.nome,
  }));
  const varias = aulas.length > 1;
  const frase = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

  for (const a of [...aulas].sort((x, y) => x.dataHora.getTime() - y.dataHora.getTime())) {
    const prefixo = varias ? `${formatarDataHora(a.dataHora)}: ` : "";
    for (const o of ocupadas) {
      if (o.dataHora >= fimDaAula(a) || fimDaAula(o) <= a.dataHora) continue;
      const quando = `às ${formatarHora(o.dataHora)}`;
      if (o.alunoId === matricula.alunoId) return frase(`${prefixo}o aluno já tem aula ${quando}.`);
      if (a.veiculoId && o.veiculoId === a.veiculoId) {
        return frase(`${prefixo}o veículo ${o.placa ?? ""} já está em aula ${quando} com ${o.alunoNome}.`);
      }
      if (o.instrutorId === a.instrutorId && !(a.tipo === "teorica" && o.tipo === "teorica")) {
        const nome = instrutores.find((i) => i.id === a.instrutorId)?.nome ?? o.instrutorNome;
        return frase(`${prefixo}${nome} já tem aula ${quando} com ${o.alunoNome}.`);
      }
    }
    // As aulas já conferidas do grupo também passam a ocupar o horário.
    ocupadas.push({
      ...a,
      alunoId: matricula.alunoId,
      alunoNome: matricula.aluno.nome,
      placa: veiculos.find((v) => v.id === a.veiculoId)?.placa,
    });
  }
  return null;
}
