import "server-only";
import { db } from "./db";
import { DURACAO_EXAME } from "./disponibilidade";
import { carregarFeriados, carregarFuncionamento } from "./feriados-servidor";
import { foraDoHorario } from "./horarios";
import { fimDaAula, formatarDataHora, formatarHora, resumoAulas, resumoPorCategoria } from "./aulas";

export type NovaAula = {
  tipo: string;
  instrutorId: number;
  veiculoId: number | null;
  dataHora: Date;
  duracaoMin: number;
  // Marcada como exceção: pode ficar fora do horário de funcionamento e em feriado.
  excecao?: boolean;
};

// Situações em que a aula ocupa o saldo contratado (falta e cancelamento não ocupam).
const CONSOME_SALDO = ["agendada", "presente"];

// Confere um grupo de aulas da mesma matrícula: aluno ativo, instrutor e veículo
// ativos e compatíveis, saldo de aulas contratadas e conflitos de horário (com as
// aulas já marcadas e entre as próprias aulas do grupo).
// `editando` indica a aula que está sendo alterada, para não conflitar consigo mesma
// (`mesmoHorario`: a data e o horário não mudaram, então o funcionamento não é conferido).
// Devolve a mensagem de erro, ou null se estiver tudo certo.
export async function verificarAulas(
  matriculaId: number,
  aulas: NovaAula[],
  editando?: { id: number; status: string; mesmoHorario?: boolean },
): Promise<string | null> {
  if (aulas.length === 0) return "Escolha ao menos uma data.";

  const matricula = await db.matricula.findUnique({
    where: { id: matriculaId },
    include: { aluno: true, aulas: { select: { id: true, tipo: true, status: true, categoria: true } } },
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
    // Matrícula de duas categorias (ex.: AB): cada aula prática conta na categoria do veículo.
    const porCategoria = resumoPorCategoria(
      matricula,
      matricula.aulas.filter((a) => a.id !== editando?.id),
    );
    for (const r of porCategoria) {
      const pedidas = aulas.filter(
        (a) => a.tipo === "pratica" && veiculos.find((v) => v.id === a.veiculoId)?.categoria === r.categoria,
      ).length;
      if (pedidas > r.restantes) {
        return r.restantes === 0
          ? `Este aluno não tem mais aulas práticas da categoria ${r.categoria} para agendar (${r.feitas} feitas, ${r.agendadas} agendadas de ${r.contratadas}). Use um veículo de outra categoria.`
          : `Você escolheu ${pedidas} aulas da categoria ${r.categoria}, mas só restam ${r.restantes} dessa categoria.`;
      }
    }
  }

  // Conflitos de horário: o mesmo aluno, instrutor ou veículo não pode estar em
  // duas aulas ao mesmo tempo. Exceção: aulas teóricas do mesmo instrutor no
  // mesmo horário são uma turma. Aula cancelada não ocupa horário.
  if (editando?.status === "cancelada") return null;

  // Horário de funcionamento: dia fechado, feriado, antes de abrir, depois de fechar
  // ou no almoço, só como exceção (ou num dia especial cadastrado em Configurações > Horários).
  const conferir = editando?.mesmoHorario ? [] : aulas.filter((a) => !a.excecao);
  if (conferir.length) {
    const dias = conferir.map((a) => diaLocal(a.dataHora));
    const funcionamento = await carregarFuncionamento(
      dias.reduce((m, d) => (d < m ? d : m)),
      dias.reduce((m, d) => (d > m ? d : m)),
    );
    for (const a of [...conferir].sort((x, y) => x.dataHora.getTime() - y.dataHora.getTime())) {
      const dia = diaLocal(a.dataHora);
      const f = funcionamento(dia);
      const motivo = f.aberto ? foraDoHorario(f, horaLocal(a.dataHora), horaLocal(fimDaAula(a))) : f.motivo;
      if (motivo) {
        const quando = `${dia.split("-").reverse().join("/")}${f.aberto ? ` às ${formatarHora(a.dataHora)}` : ""}`;
        return `${quando}: ${motivo}. Escolha outro dia ou horário, ou marque "Exceção" para agendar mesmo assim.`;
      }
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

// Categoria de cada aula prática: a do veículo usado.
export async function comCategoria<T extends NovaAula>(aulas: T[]) {
  const ids = [...new Set(aulas.map((a) => a.veiculoId).filter((x): x is number => x !== null))];
  const veiculos = await db.veiculo.findMany({ where: { id: { in: ids } }, select: { id: true, categoria: true } });
  return aulas.map((a) => ({
    ...a,
    categoria: a.tipo === "pratica" ? (veiculos.find((v) => v.id === a.veiculoId)?.categoria ?? null) : null,
  }));
}

const diaLocal = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const horaLocal = (d: Date) =>
  d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
