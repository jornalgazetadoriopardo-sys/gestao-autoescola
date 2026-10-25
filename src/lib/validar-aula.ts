import "server-only";
import { db } from "./db";
import { DURACAO_EXAME } from "./disponibilidade";
import { carregarFeriados } from "./feriados-servidor";
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

  // Feriado: não se marca aula (a autoescola pode deixar de seguir um feriado em Configurações).
  const diasDasAulas = aulas.map((a) => a.dataHora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }));
  const feriados = await carregarFeriados(
    diasDasAulas.reduce((m, d) => (d < m ? d : m)),
    diasDasAulas.reduce((m, d) => (d > m ? d : m)),
  );
  for (const dia of diasDasAulas) {
    const nome = feriados.get(dia);
    if (nome) {
      return `${dia.split("-").reverse().join("/")} é feriado (${nome}). Escolha outro dia ou desmarque esse feriado em Configurações > Feriados.`;
    }
  }

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
  // Exames do Detran com horário marcado também ocupam aluno, veículo e instrutor.
  const exames = await db.etapa.findMany({
    where: {
      hora: { not: null },
      resultado: null,
      data: { gte: new Date(inicio - 24 * 60 * 60 * 1000), lt: new Date(fim + 24 * 60 * 60 * 1000) },
      OR: [
        { instrutorId: { in: ids(aulas.map((a) => a.instrutorId)) } },
        { veiculoId: { in: ids(aulas.map((a) => a.veiculoId)) } },
        { matricula: { alunoId: matricula.alunoId } },
      ],
    },
    include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
  });
  const ocupadas: Ocupada[] = exames.map((e) => ({
    tipo: "exame",
    instrutorId: e.instrutorId ?? 0,
    veiculoId: e.veiculoId,
    dataHora: new Date(`${e.data!.toISOString().slice(0, 10)}T${e.hora}:00-03:00`),
    duracaoMin: DURACAO_EXAME,
    alunoId: e.matricula.alunoId,
    alunoNome: `${e.matricula.aluno.nome} (${e.descricao.toLowerCase()})`,
    placa: e.veiculo?.placa,
    instrutorNome: e.instrutor?.nome,
  }));
  ocupadas.push(
    ...existentes.map((e) => ({
      tipo: e.tipo,
      instrutorId: e.instrutorId ?? 0,
      veiculoId: e.veiculoId,
      dataHora: e.dataHora,
      duracaoMin: e.duracaoMin,
      alunoId: e.matricula.alunoId,
      alunoNome: e.matricula.aluno.nome,
      placa: e.veiculo?.placa,
      instrutorNome: e.instrutor?.nome,
    })),
  );
  const varias = aulas.length > 1;
  const frase = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

  for (const a of [...aulas].sort((x, y) => x.dataHora.getTime() - y.dataHora.getTime())) {
    const prefixo = varias ? `${formatarDataHora(a.dataHora)}: ` : "";
    for (const o of ocupadas) {
      if (o.dataHora >= fimDaAula(a) || fimDaAula(o) <= a.dataHora) continue;
      const quando = `às ${formatarHora(o.dataHora)}`;
      const oQue = o.tipo === "exame" ? "exame do Detran" : "aula";
      if (o.alunoId === matricula.alunoId) return frase(`${prefixo}o aluno já tem ${oQue} ${quando}.`);
      if (a.veiculoId && o.veiculoId === a.veiculoId) {
        return frase(`${prefixo}o veículo ${o.placa ?? ""} já está em ${oQue} ${quando} com ${o.alunoNome}.`);
      }
      if (o.instrutorId === a.instrutorId && !(a.tipo === "teorica" && o.tipo === "teorica")) {
        const nome = instrutores.find((i) => i.id === a.instrutorId)?.nome ?? o.instrutorNome;
        return frase(`${prefixo}${nome} já tem ${oQue} ${quando} com ${o.alunoNome}.`);
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

// Exame do Detran com horário: não pode cair em feriado nem bater com aulas do
// aluno, do veículo ou do instrutor que acompanha. Vários exames no mesmo
// horário são permitidos (o instrutor leva mais de um aluno para a prova).
export async function verificarExame(e: {
  alunoId: number;
  dia: string;
  hora: string;
  veiculoId: number | null;
  instrutorId: number | null;
}): Promise<string | null> {
  const nome = (await carregarFeriados(e.dia, e.dia)).get(e.dia);
  if (nome) return `${e.dia.split("-").reverse().join("/")} é feriado (${nome}). Confira a data do exame.`;

  const inicio = new Date(`${e.dia}T${e.hora}:00-03:00`);
  const fim = new Date(inicio.getTime() + DURACAO_EXAME * 60_000);
  const aulas = await db.aula.findMany({
    where: {
      status: { not: "cancelada" },
      dataHora: { gte: new Date(inicio.getTime() - 4 * 60 * 60 * 1000), lt: fim },
      OR: [
        { matricula: { alunoId: e.alunoId } },
        ...(e.veiculoId ? [{ veiculoId: e.veiculoId }] : []),
        ...(e.instrutorId ? [{ instrutorId: e.instrutorId }] : []),
      ],
    },
    orderBy: { dataHora: "asc" },
    include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
  });
  const a = aulas.find((x) => fimDaAula(x) > inicio);
  if (!a) return null;
  const quando = `às ${formatarHora(a.dataHora)}`;
  if (a.matricula.alunoId === e.alunoId) return `O aluno tem aula ${quando} neste dia. Remarque a aula ou o exame.`;
  if (e.veiculoId && a.veiculoId === e.veiculoId) {
    return `O veículo ${a.veiculo?.placa ?? ""} está em aula ${quando} com ${a.matricula.aluno.nome}.`;
  }
  return `${a.instrutor?.nome ?? "O instrutor"} tem aula ${quando} com ${a.matricula.aluno.nome}.`;
}
